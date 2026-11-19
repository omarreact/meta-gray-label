<?php
/**
 * Optional WP-CLI importer. Nothing runs during normal WordPress page loads,
 * theme activation, or editor use. Existing pages are never overwritten.
 */
defined( 'ABSPATH' ) || exit;

WP_CLI::add_command( 'mgl import-pages', static function ( array $args, array $assoc ): void {
    $apply = isset( $assoc['apply'] );
    $front = isset( $assoc['set-homepage'] );
    $native = isset( $assoc['native'] );
    if ( $front && ! $apply ) {
        WP_CLI::error( 'Use --apply with --set-homepage; the default is a dry run.' );
    }

    $data = mgl_content_data();
    $pages = $data['pages'] ?? array();
    $names = array();
    foreach ( ( $data['pageMap']['pages'] ?? array() ) as $mapped ) {
        if ( ! empty( $mapped['path'] ) && ! empty( $mapped['title'] ) ) {
            $names[ $mapped['path'] ] = $mapped['title'];
        }
    }

    $native_pages = array();
    if ( $native ) {
        $manifest_path = get_theme_file_path( 'data/fse-pages/manifest.json' );
        $manifest_raw  = is_readable( $manifest_path ) ? file_get_contents( $manifest_path ) : false;
        $manifest      = $manifest_raw ? json_decode( $manifest_raw, true ) : null;
        if ( ! is_array( $manifest ) || ! isset( $manifest['pages'] ) ) {
            WP_CLI::error( 'Native block files missing. Package the theme using node scripts/package-wordpress.mjs --write.' );
        }
        $native_pages = $manifest['pages'];
    }

    $created = 0;
    $home_id = 0;
    $items = array();
    foreach ( $pages as $path => $record ) {
        if ( ! is_array( $record ) || ( $record['role'] ?? '' ) !== 'page' ||
            '404.html' === $path ) {
            continue;
        }
        $route = $record['route'] ?? '';
        $slug  = '/' === $route ? 'home' : trim( str_replace( '.html', '', $route ), '/' );
        if ( '' !== $slug ) {
            $items[ $slug ] = array( 'path' => $path, 'title' => $names[ $path ] ?? '' );
        }
    }
    // Sort parent pages before children.
    uksort( $items, static function ( string $a, string $b ): int {
        return substr_count( $a, '/' ) <=> substr_count( $b, '/' ) ?: strcmp( $a, $b );
    } );

    foreach ( $items as $path => $item ) {
        $segments = explode( '/', $path );
        $parent = 0;
        $joined = '';
        foreach ( $segments as $index => $segment ) {
            $joined = $joined ? $joined . '/' . $segment : $segment;
            $existing = get_page_by_path( $joined, OBJECT, 'page' );
            if ( $existing instanceof WP_Post ) {
                $parent = $existing->ID;
                continue;
            }
            $last = $index === count( $segments ) - 1;
            $title = $last && $item['title'] ? $item['title'] : ucwords( str_replace( '-', ' ', $segment ) );
            WP_CLI::log( ( $apply ? 'CREATE ' : 'DRY RUN ' ) . $joined . ' — ' . $title );
            if ( ! $apply ) {
                // Continue with placeholder parent IDs; no database changes.
                continue;
            }
            $native_content = '';
            $native_layout = $last && isset( $native_pages[ $item['path'] ] );
            if ( $native_layout ) {
                $relative = $native_pages[ $item['path'] ]['file'] ?? '';
                if ( ! is_string( $relative ) || ! preg_match( '#^[a-z0-9/-]+\.html$#', $relative ) || str_contains( $relative, '..' ) ) {
                    WP_CLI::error( 'Invalid native page file for ' . $item['path'] );
                }
                $source_file = get_theme_file_path( 'data/fse-pages/' . $relative );
                $native_content = is_readable( $source_file ) ? file_get_contents( $source_file ) : false;
                if ( ! is_string( $native_content ) || ! str_contains( $native_content, '<!-- wp:group' ) ) {
                    WP_CLI::error( 'Missing or invalid core blocks for ' . $item['path'] );
                }
            }
            $id = wp_insert_post( array(
                'post_type'    => 'page',
                'post_status'  => 'publish',
                'post_title'   => $title,
                'post_name'    => $segment,
                'post_parent'  => $parent,
                'post_content' => $native_layout ? $native_content : '',
            ), true );
            if ( is_wp_error( $id ) ) {
                WP_CLI::error( $id->get_error_message() );
            }
            if ( $native_layout ) {
                update_post_meta( $id, '_mgl_native_layout', '1' );
                if ( 'home' !== $joined ) {
                    update_post_meta( $id, '_wp_page_template', 'page-native' );
                }
            }
            $created++;
            $parent = (int) $id;
        }
        if ( 'home' === $path && $apply ) {
            $home = get_page_by_path( 'home', OBJECT, 'page' );
            $home_id = $home instanceof WP_Post ? $home->ID : 0;
        }
    }

    if ( $front && $home_id ) {
        update_option( 'show_on_front', 'page' );
        update_option( 'page_on_front', $home_id );
        WP_CLI::log( 'Front page configured.' );
    }
    WP_CLI::success( ( $apply ? 'Created ' . $created . ' page(s).' : 'Dry run complete.' ) .
        ' Existing pages were not overwritten; native is opt-in.' );
} );
