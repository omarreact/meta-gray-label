<?php
/**
 * Meta Grey Label block-theme integration.
 * Static HTML continues to be produced by scripts/generate.mjs.
 */
defined( 'ABSPATH' ) || exit;
require_once get_theme_file_path( 'inc/renderer.php' );

add_action( 'init', static function (): void {
    register_block_type( 'mgl/page', array(
        'api_version' => 3,
        'render_callback' => 'mgl_render_page',
    ) );
    register_block_type( 'mgl/header', array(
        'api_version' => 3,
        'render_callback' => 'mgl_render_header',
    ) );
    register_block_type( 'mgl/footer', array(
        'api_version' => 3,
        'render_callback' => 'mgl_render_footer',
    ) );
} );

add_action( 'wp_enqueue_scripts', static function (): void {
    $root = get_theme_file_uri();
    $style_names = array(
        'bootstrap.min.css',
        'aos.css',
        'all.min.css',
        'swiper-bundle.min.css',
        'style.css',
    );
    $previous = array();
    foreach ( $style_names as $name ) {
        $handle = 'mgl-style-' . sanitize_key( $name );
        wp_enqueue_style( $handle, $root . '/assets/css/' . $name, $previous, '0.1.0' );
        $previous = array( $handle );
    }
    wp_enqueue_style( 'mgl-wp-compat', get_stylesheet_uri(), $previous, '0.1.0' );

    $scripts = array(
        'bootstrap.bundle.min.js',
        'all.min.js',
        'swiper-bundle.min.js',
        'aos.js',
        'purecounter_vanilla.js',
        'custom.js',
    );
    $deps = array();
    foreach ( $scripts as $name ) {
        $handle = 'mgl-script-' . sanitize_key( $name );
        wp_enqueue_script( $handle, $root . '/assets/js/' . $name, $deps, '0.1.0', true );
        $deps = array( $handle );
        if ( 'custom.js' === $name ) {
            wp_add_inline_script(
                $handle,
                "document.documentElement.setAttribute('data-bs-theme',localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');",
                'before'
            );
        }
    }
} );

add_action( 'enqueue_block_editor_assets', static function (): void {
    wp_enqueue_script(
        'mgl-block-placeholders',
        get_theme_file_uri( 'inc/editor.js' ),
        array( 'wp-blocks', 'wp-element', 'wp-components' ),
        '0.1.0',
        true
    );
} );

add_filter( 'pre_get_document_title', static function ( $title ) {
    $source = mgl_page_source_path();
    $html   = $source ? mgl_template_markup( $source ) : '';
    if ( $html && preg_match( '#<title>(.*?)</title>#is', $html, $matches ) ) {
        return trim( wp_strip_all_tags( $matches[1] ) );
    }
    return $title;
} );

add_action( 'wp_head', static function (): void {
    $source = mgl_page_source_path();
    $html   = $source ? mgl_template_markup( $source ) : '';
    if ( $html && preg_match( '/<meta name="description" content="([^"]*)"/i', $html, $match ) ) {
        echo '<meta name="description" content="' . esc_attr( html_entity_decode( $match[1], ENT_QUOTES, 'UTF-8' ) ) . '">' . "\n";
    }
    echo '<link id="site-favicon" rel="icon" type="image/svg+xml" href="' . esc_url( get_theme_file_uri( 'media/branding/favicon.svg' ) ) . '">' . "\n";
    echo '<link id="site-icon-large" rel="icon" type="image/png" sizes="192x192" href="' . esc_url( get_theme_file_uri( 'media/branding/icon-192.png' ) ) . '">' . "\n";
    echo '<link id="site-apple-icon" rel="apple-touch-icon" sizes="180x180" href="' . esc_url( get_theme_file_uri( 'media/branding/apple-touch-icon.png' ) ) . '">' . "\n";
} );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
    require_once get_theme_file_path( 'inc/import-pages.php' );
}
