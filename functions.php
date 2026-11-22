<?php
defined( 'ABSPATH' ) || exit;

function mgl_content_data(): array {
    static $data = null;
    if ( null !== $data ) {
        return $data;
    }
    $path = get_theme_file_path( 'data/content.json' );
    $raw  = is_readable( $path ) ? file_get_contents( $path ) : false;
    $data = is_string( $raw ) ? json_decode( $raw, true ) : null;
    if ( ! is_array( $data ) || ! isset( $data['pages'], $data['pageMap'] ) ) {
        $data = array( 'pages' => array(), 'pageMap' => array( 'pages' => array() ) );
    }
    return $data;
}

add_action( 'after_setup_theme', static function (): void {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_editor_style( 'assets/css/fse.css' );
    add_editor_style( 'assets/css/inner-pages.css' );
} );

add_action( 'wp_enqueue_scripts', static function (): void {
    wp_enqueue_style(
        'mgl-fse-native',
        get_theme_file_uri( 'assets/css/fse.css' ),
        array(),
        '1.0.0'
    );

    wp_enqueue_style(
        'mgl-site-settings',
        get_theme_file_uri( 'assets/css/site-settings.css' ),
        array( 'mgl-fse-native' ),
        '1.0.0'
    );

    wp_enqueue_style( 'mgl-inner-system', get_theme_file_uri( 'assets/css/inner-pages.css' ), array( 'mgl-site-settings' ), '1.0.0' );

    if ( function_exists( 'is_page' ) && is_page( 'contact' ) ) {
        wp_enqueue_script( 'mgl-contact-brief', get_theme_file_uri( 'assets/js/contact-brief.js' ), array(), '1.0.0', true );
    }

    wp_enqueue_script(
        'mgl-site-settings',
        get_theme_file_uri( 'assets/js/site-settings.js' ),
        array(),
        '1.0.0',
        true
    );
} );

add_action( 'wp_head', static function (): void {
    if ( ! has_site_icon() ) {
        echo '<link rel="icon" type="image/svg+xml" href="' .
            esc_url( get_theme_file_uri( 'media/branding/favicon.svg' ) ) .
            '">' . "\n";
    }
}, 15 );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
    require_once get_theme_file_path( 'inc/import-pages.php' );
}

// Match the static renderer's theme selection before the inner page paints.
// Kept outside post content so every Gutenberg section remains native/editable.
add_action( 'wp_head', static function (): void {
    if ( ! function_exists( 'is_page' ) || ! is_page() ||
         ! str_contains( (string) get_post_field( 'post_content', get_queried_object_id() ), 'mgl-design' ) ) {
        return;
    }
    echo "<script id=\"mgl-inner-theme-boot\">(function(){try{var q=new URLSearchParams(location.search).get('theme');var s=localStorage.getItem('theme');var t=q==='light'||q==='dark'?q:s==='light'||s==='dark'?s:'dark';document.documentElement.setAttribute('data-bs-theme',t)}catch(e){document.documentElement.setAttribute('data-bs-theme','dark')}})();</script>\n";
}, 1 );
