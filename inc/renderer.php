<?php
/**
 * Reuses the checked-in JSON and page-specific static HTML templates.
 * The bridge is intentionally server-rendered; native Gutenberg editing of
 * legacy layout sections is a separate migration step.
 */
defined( 'ABSPATH' ) || exit;

/** @return array<string, mixed> */
function mgl_content_data(): array {
    static $data = null;
    if ( null !== $data ) {
        return $data;
    }
    $path = get_theme_file_path( 'data/content.json' );
    $raw  = is_readable( $path ) ? file_get_contents( $path ) : false;
    $data = is_string( $raw ) ? json_decode( $raw, true ) : null;
    if ( ! is_array( $data ) || ! isset( $data['pages'] ) ) {
        error_log( 'Meta Grey Label: invalid or missing data/content.json.' );
        $data = array( 'pages' => array() );
    }
    return $data;
}

function mgl_page_source_path(): string {
    if ( is_404() ) {
        return '404.html';
    }
    if ( is_front_page() ) {
        return 'index.html';
    }
    if ( is_page() ) {
        $id   = get_queried_object_id();
        $slug = trim( (string) get_page_uri( $id ), '/' );
        if ( 'services' === $slug || 'services.html' === $slug ) {
            return 'services.html';
        }
        if ( '' !== $slug ) {
            return $slug . '/index.html';
        }
    }
    return '';
}

function mgl_template_markup( string $source ): string {
    $pages = mgl_content_data()['pages'];
    if ( ! isset( $pages[ $source ] ) || ! is_array( $pages[ $source ] ) ) {
        return '';
    }
    $record = $pages[ $source ];
    $name   = $record['template'] ?? '';
    if ( ! is_string( $name ) || ! preg_match( '#^templates/(pages|shared)/[a-zA-Z0-9/_-]+\.html$#', $name ) ) {
        return '';
    }
    $path = get_theme_file_path( $name );
    $raw  = is_readable( $path ) ? file_get_contents( $path ) : false;
    if ( ! is_string( $raw ) ) {
        return '';
    }
    $fields = $record['fields'] ?? array();
    if ( ! is_array( $fields ) ) {
        return '';
    }
    return (string) preg_replace_callback(
        '/__MGL_CONTENT_\d{5}__/',
        static function ( array $matches ) use ( $fields ): string {
            return isset( $fields[ $matches[0] ] ) && is_string( $fields[ $matches[0] ] )
                ? $fields[ $matches[0] ]
                : '';
        },
        $raw
    );
}

function mgl_resolve_asset_or_route( string $url, string $source, string $attr ): string {
    if ( '' === $url || '#' === $url || str_starts_with( $url, '#' ) ||
        preg_match( '#^(?:[a-z][a-z0-9+.-]*:|//)#i', $url ) ) {
        return $url;
    }
    if ( str_starts_with( $url, '/' ) ) {
        return 'href' === $attr ? home_url( $url ) : $url;
    }
    $split = strcspn( $url, '?#' );
    $path  = substr( $url, 0, $split );
    $tail  = substr( $url, $split );
    if ( '' === $path ) {
        return $url;
    }
    $dir = dirname( $source );
    $parts = explode( '/', ( '.' === $dir ? '' : $dir . '/' ) . $path );
    $stack = array();
    foreach ( $parts as $part ) {
        if ( '' === $part || '.' === $part ) {
            continue;
        }
        if ( '..' === $part ) {
            array_pop( $stack );
            continue;
        }
        $stack[] = $part;
    }
    $normalized = implode( '/', $stack );
    if ( preg_match( '#^(assets|media|fonts|cdn)/#', $normalized ) ) {
        return get_theme_file_uri( $normalized ) . $tail;
    }
    if ( 'href' !== $attr ) {
        return $url;
    }
    if ( 'index.html' === $normalized ) {
        return home_url( '/' ) . $tail;
    }
    if ( 'services.html' === $normalized ) {
        return home_url( '/services/' ) . $tail;
    }
    if ( str_ends_with( $normalized, '/index.html' ) ) {
        return home_url( '/' . substr( $normalized, 0, -10 ) ) . $tail;
    }
    return home_url( '/' . $normalized ) . $tail;
}

function mgl_rewrite_links( string $html, string $source ): string {
    // Avoid rewriting string literals in inline scripts or CSS.
    $chunks = preg_split(
        '#(<script\b[^>]*>.*?</script\s*>|<style\b[^>]*>.*?</style\s*>)#is',
        $html,
        -1,
        PREG_SPLIT_DELIM_CAPTURE
    );
    if ( ! is_array( $chunks ) ) {
        return $html;
    }
    foreach ( $chunks as $index => &$chunk ) {
        if ( $index % 2 ) {
            continue;
        }
        $chunk = (string) preg_replace_callback(
            '#<(?:[a-z][a-z0-9:-]*)(?:\s+[^<>]*?)?>#is',
            static function ( array $tag ) use ( $source ): string {
                return (string) preg_replace_callback(
                    '/\b(src|href|poster)=(["\x27])([^"\x27]*)\2/i',
                    static function ( array $match ) use ( $source ): string {
                        $value = mgl_resolve_asset_or_route( html_entity_decode( $match[3], ENT_QUOTES, 'UTF-8' ), $source, strtolower( $match[1] ) );
                        return $match[1] . '=' . $match[2] . esc_attr( $value ) . $match[2];
                    },
                    $tag[0]
                );
            },
            $chunk
        );
    }
    unset( $chunk );
    return implode( '', $chunks );
}

/**
 * Native mode must be explicitly enabled: never silently replace an approved
 * page design with a simplified Gutenberg projection.
 */
function mgl_is_native_layout(): bool {
    if ( ! is_page() && ! is_front_page() ) {
        return false;
    }
    $id = (int) get_queried_object_id();
    if ( ! $id ) {
        return false;
    }
    return '1' === get_post_meta( $id, '_mgl_native_layout', true ) ||
        is_page_template( 'page-native' );
}

/** WordPress supplies the html/head/body and wp_head/wp_footer hooks itself. */
function mgl_render_page(): string {
    // Explicitly imported Gutenberg content takes precedence over legacy HTML.
    // Never enable automatically for existing pages: approved designs remain safe.
    if ( is_page() || is_front_page() ) {
        $current = get_queried_object();
        if ( $current instanceof WP_Post &&
            '1' === get_post_meta( $current->ID, '_mgl_native_layout', true ) &&
            ! empty( $current->post_content ) && has_blocks( $current->post_content ) ) {
            return apply_filters( 'the_content', $current->post_content );
        }
    }
    $source = mgl_page_source_path();
    if ( '' === $source ) {
        if ( is_singular() ) {
            $post = get_queried_object();
            return $post instanceof WP_Post ? '<main class="mgl-wp-content">' . apply_filters( 'the_content', $post->post_content ) . '</main>' : '';
        }
        return '';
    }
    $html = mgl_template_markup( $source );
    if ( '' === $html ) {
        return '';
    }
    preg_match_all( '#<style\b[^>]*>.*?</style\s*>#is', $html, $style_blocks );
    $styles = implode( "\n", $style_blocks[0] );
    if ( ! preg_match( '#<body\b[^>]*>(.*?)</body\s*>#is', $html, $match ) ) {
        return '';
    }
    $body = $match[1];
    $body = (string) preg_replace( '#<template\b[^>]*\bdata-shared-part=["\x27](?:header|footer)["\x27][^>]*>.*?</template\s*>#is', '', $body );
    $body = (string) preg_replace( '#<script\b[^>]*\bsrc=["\x27][^"\x27]+["\x27][^>]*>.*?</script\s*>#is', '', $body );
    return $styles . "\n" . mgl_rewrite_links( $body, $source );
}

function mgl_render_header(): string {
    // The front-page fallback template uses this bridge for both modes.
    // Resolve the native template part through WP so Site Editor overrides work.
    if ( mgl_is_native_layout() ) {
        return do_blocks( '<!-- wp:template-part {"slug":"header-native"} /-->' );
    }
    return mgl_rewrite_links( mgl_template_markup( 'header.html' ), 'header.html' );
}

function mgl_render_footer(): string {
    if ( mgl_is_native_layout() ) {
        return do_blocks( '<!-- wp:template-part {"slug":"footer-native"} /-->' );
    }
    return mgl_rewrite_links( mgl_template_markup( 'footer.html' ), 'footer.html' );
}
