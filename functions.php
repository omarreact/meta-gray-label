<?php
/**
 * Meta Grey Label: static HTML fallback + opt-in native block theme.
 * The existing static site never executes this file.
 */
defined( 'ABSPATH' ) || exit;

require_once get_theme_file_path( 'inc/renderer.php' );

add_action( 'after_setup_theme', static function (): void {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    // The scoped native stylesheet also previews blocks in the Site Editor.
    add_editor_style( 'assets/css/fse.css' );
} );

// Block metadata is the canonical server-side registration source.
add_action( 'init', static function (): void {
    foreach ( array(
        'legacy-page'   => 'mgl_render_page',
        'legacy-header' => 'mgl_render_header',
        'legacy-footer' => 'mgl_render_footer',
    ) as $directory => $callback ) {
        register_block_type(
            get_theme_file_path( 'blocks/' . $directory ),
            array( 'render_callback' => $callback )
        );
    }
} );

add_action( 'wp_enqueue_scripts', static function (): void {
    $root = get_theme_file_uri();

    // Native pages use core block styles and a small mgl-prefixed stylesheet.
    // Never load Bootstrap, Font Awesome, AOS, Swiper or legacy JS here.
    if ( mgl_is_native_layout() ) {
        wp_enqueue_style(
            'mgl-fse-native',
            $root . '/assets/css/fse.css',
            array(),
            '0.2.0'
        );
        return;
    }

    // The fallback is intentionally unchanged until real WP visual parity QA.
    $previous = array();
    foreach ( array(
        'bootstrap.min.css',
        'aos.css',
        'all.min.css',
        'swiper-bundle.min.css',
        'style.css',
    ) as $name ) {
        $handle = 'mgl-legacy-css-' . sanitize_key( $name );
        wp_enqueue_style(
            $handle,
            $root . '/assets/css/' . $name,
            $previous,
            '0.2.0'
        );
        $previous = array( $handle );
    }
    wp_enqueue_style( 'mgl-wp-compat', get_stylesheet_uri(), $previous, '0.2.0' );

    $dependencies = array();
    foreach ( array(
        'bootstrap.bundle.min.js',
        'all.min.js',
        'swiper-bundle.min.js',
        'aos.js',
        'purecounter_vanilla.js',
        'custom.js',
    ) as $name ) {
        $handle = 'mgl-legacy-js-' . sanitize_key( $name );
        wp_enqueue_script(
            $handle,
            $root . '/assets/js/' . $name,
            $dependencies,
            '0.2.0',
            true
        );
        $dependencies = array( $handle );
    }
} );

// Legacy page renderer placeholders need a tiny editor preview only.
add_action( 'enqueue_block_editor_assets', static function (): void {
    wp_enqueue_script(
        'mgl-legacy-block-editor',
        get_theme_file_uri( 'inc/editor.js' ),
        array( 'wp-blocks', 'wp-element', 'wp-components' ),
        '0.2.0',
        true
    );
} );

function mgl_seo_plugin_active(): bool {
    return defined( 'WPSEO_VERSION' ) ||
        defined( 'RANK_MATH_VERSION' ) ||
        defined( 'AIOSEO_VERSION' ) ||
        defined( 'SEOPRESS_VERSION' ) ||
        class_exists( 'AIOSEO\\Plugin\\AIOSEO', false );
}

// WordPress core prints the title and canonical via wp_head.
// Override only legacy page titles; native edited pages use their WP title.
add_filter( 'pre_get_document_title', static function ( $title ) {
    if ( mgl_is_native_layout() || mgl_seo_plugin_active() ) {
        return $title;
    }
    $source = mgl_page_source_path();
    $html = $source ? mgl_template_markup( $source ) : '';
    return $html && preg_match( '#<title>(.*?)</title>#is', $html, $matches )
        ? trim( wp_strip_all_tags( $matches[1] ) )
        : $title;
} );

add_action( 'wp_head', static function (): void {
    if ( mgl_seo_plugin_active() ) {
        return; // SEO plugin owns descriptions and structured data.
    }
    $source = mgl_page_source_path();
    $html = $source ? mgl_template_markup( $source ) : '';
    if ( $html && preg_match( '/<meta\\s+name=["\\x27]description["\\x27]\\s+content=["\\x27]([^"\\x27]*)["\\x27]/i', $html, $match ) ) {
        echo '<meta name="description" content="' .
            esc_attr( html_entity_decode( $match[1], ENT_QUOTES, 'UTF-8' ) ) .
            '">' . "\n";
    }
    // An explicitly configured WordPress Site Icon always wins.
    if ( ! has_site_icon() ) {
        echo '<link rel="icon" type="image/svg+xml" href="' .
            esc_url( get_theme_file_uri( 'media/branding/favicon.svg' ) ) .
            '">' . "\n";
    }
    // No competing rel=canonical; WordPress core provides it on singulars.
    // No fabricated reviews, ratings, FAQs or other structured data.
}, 15 );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
    require_once get_theme_file_path( 'inc/import-pages.php' );
}
