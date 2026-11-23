<?php
defined( 'ABSPATH' ) || exit;

/**
 * Build the native page import plan from the packaged manifest.
 *
 * @return array|WP_Error
 */
function mgl_native_page_import_plan() {
    $data  = mgl_content_data();
    $pages = $data['pages'] ?? array();
    $names = array();

    foreach ( ( $data['pageMap']['pages'] ?? array() ) as $mapped ) {
        if ( ! empty( $mapped['path'] ) && ! empty( $mapped['title'] ) ) {
            $names[ $mapped['path'] ] = $mapped['title'];
        }
    }

    $manifest_path = get_theme_file_path( 'data/fse-pages/manifest.json' );
    $manifest_raw  = is_readable( $manifest_path ) ? file_get_contents( $manifest_path ) : false;
    $manifest      = is_string( $manifest_raw ) ? json_decode( $manifest_raw, true ) : null;

    if ( ! is_array( $manifest ) || ! isset( $manifest['pages'] ) || ! is_array( $manifest['pages'] ) ) {
        return new WP_Error( 'mgl_missing_manifest', 'Native block files are missing. Rebuild the installable theme package.' );
    }

    $items = array();
    foreach ( $pages as $path => $record ) {
        if ( ! is_array( $record ) || ( $record['role'] ?? '' ) !== 'page' || '404.html' === $path ) {
            continue;
        }

        $route = $record['route'] ?? '';
        $slug  = '/' === $route ? 'home' : trim( str_replace( '.html', '', $route ), '/' );
        if ( '' !== $slug ) {
            $items[ $slug ] = array(
                'path'  => $path,
                'title' => $names[ $path ] ?? '',
            );
        }
    }

    uksort( $items, static function ( string $a, string $b ): int {
        return substr_count( $a, '/' ) <=> substr_count( $b, '/' ) ?: strcmp( $a, $b );
    } );

    return array(
        'items'        => $items,
        'native_pages' => $manifest['pages'],
    );
}

/**
 * Import only missing native pages. Existing pages are never overwritten.
 *
 * @return array|WP_Error
 */
function mgl_import_native_pages( bool $apply = false, bool $set_homepage = false ) {
    if ( $set_homepage && ! $apply ) {
        return new WP_Error( 'mgl_home_requires_apply', 'Setting the homepage requires an applied import.' );
    }

    $plan = mgl_native_page_import_plan();
    if ( is_wp_error( $plan ) ) {
        return $plan;
    }

    $created  = 0;
    $existing = 0;
    $planned  = 0;
    $home_id  = 0;
    $actions  = array();

    foreach ( $plan['items'] as $path => $item ) {
        $segments = explode( '/', $path );
        $parent   = 0;
        $joined   = '';

        foreach ( $segments as $index => $segment ) {
            $joined   = $joined ? $joined . '/' . $segment : $segment;
            $existing_page = get_page_by_path( $joined, OBJECT, 'page' );

            if ( $existing_page instanceof WP_Post ) {
                $parent = (int) $existing_page->ID;
                $existing++;
                $actions[] = array( 'status' => 'EXISTS', 'path' => $joined, 'title' => get_the_title( $existing_page ) );
                if ( 'home' === $path ) {
                    $home_id = (int) $existing_page->ID;
                }
                continue;
            }

            $last    = $index === count( $segments ) - 1;
            $title   = $last && $item['title'] ? $item['title'] : ucwords( str_replace( '-', ' ', $segment ) );
            $content = '';

            if ( $last ) {
                $record   = $plan['native_pages'][ $item['path'] ] ?? null;
                $relative = is_array( $record ) ? ( $record['file'] ?? '' ) : '';

                if ( ! is_string( $relative ) || ! preg_match( '#^[a-z0-9/-]+\.html$#', $relative ) || str_contains( $relative, '..' ) ) {
                    return new WP_Error( 'mgl_invalid_native_file', 'Invalid native page file for ' . $item['path'] );
                }

                $source_file = get_theme_file_path( 'data/fse-pages/' . $relative );
                $content     = is_readable( $source_file ) ? file_get_contents( $source_file ) : false;

                if ( ! is_string( $content ) || ! str_contains( $content, '<!-- wp:group' ) ) {
                    return new WP_Error( 'mgl_missing_native_content', 'Missing native block content for ' . $item['path'] );
                }
            }

            $planned++;
            $actions[] = array(
                'status' => $apply ? 'CREATE' : 'DRY RUN',
                'path'   => $joined,
                'title'  => $title,
            );

            if ( ! $apply ) {
                continue;
            }

            $id = wp_insert_post(
                array(
                    'post_type'    => 'page',
                    'post_status'  => 'publish',
                    'post_title'   => $title,
                    'post_name'    => $segment,
                    'post_parent'  => $parent,
                    'post_content' => $content,
                ),
                true
            );

            if ( is_wp_error( $id ) ) {
                return $id;
            }

            $created++;
            $parent = (int) $id;

            if ( 'home' === $path ) {
                $home_id = (int) $id;
            }
        }
    }

    if ( $apply && $set_homepage && $home_id ) {
        update_option( 'show_on_front', 'page' );
        update_option( 'page_on_front', $home_id );
    }

    return array(
        'created'  => $created,
        'existing' => $existing,
        'planned'  => $planned,
        'home_id'  => $home_id,
        'actions'  => $actions,
    );
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
    WP_CLI::add_command( 'mgl import-pages', static function ( array $args, array $assoc ): void {
        $apply = isset( $assoc['apply'] );
        $front = isset( $assoc['set-homepage'] );
        $result = mgl_import_native_pages( $apply, $front );

        if ( is_wp_error( $result ) ) {
            WP_CLI::error( $result->get_error_message() );
        }

        foreach ( $result['actions'] as $action ) {
            WP_CLI::log( $action['status'] . ' ' . $action['path'] . ' — ' . $action['title'] );
        }

        WP_CLI::success(
            $apply
                ? 'Created ' . $result['created'] . ' page(s). Existing pages were not overwritten.'
                : 'Dry run complete. ' . $result['planned'] . ' missing page(s) would be created.'
        );
    } );
}
