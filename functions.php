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
    add_editor_style( 'assets/css/directories.css' );
    add_editor_style( 'assets/css/native-chrome.css' );
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

    wp_enqueue_style( 'mgl-directories', get_theme_file_uri( 'assets/css/directories.css' ), array( 'mgl-inner-system' ), '1.0.0' );
    wp_enqueue_style( 'mgl-native-chrome', get_theme_file_uri( 'assets/css/native-chrome.css' ), array( 'mgl-inner-system' ), '1.0.0' );
    wp_enqueue_script( 'mgl-native-chrome', get_theme_file_uri( 'assets/js/native-chrome.js' ), array(), '1.0.0', true );
    if ( function_exists( 'is_page' ) && is_page( array( 'services', 'solutions', 'insights' ) ) ) {
        wp_enqueue_script( 'mgl-directories', get_theme_file_uri( 'assets/js/directories.js' ), array(), '1.0.0', true );
    }
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

require_once get_theme_file_path( 'inc/import-pages.php' );
require_once get_theme_file_path( 'inc/admin-setup.php' );

// Match the static renderer's theme selection before the inner page paints.
// Kept outside post content so every Gutenberg section remains native/editable.
add_action( 'wp_head', static function (): void {

    echo "<script id=\"mgl-inner-theme-boot\">(function(){try{var q=new URLSearchParams(location.search).get('theme');var s=localStorage.getItem('theme');var t=q==='light'||q==='dark'?q:s==='light'||s==='dark'?s:'dark';document.documentElement.setAttribute('data-bs-theme',t)}catch(e){document.documentElement.setAttribute('data-bs-theme','dark')}})();</script>\n";
}, 1 );

// The native Site Logo remains editable; the approved wordmark is the default
// only while the site owner has not selected a custom logo attachment.
add_filter( 'render_block_core/site-logo', static function ( string $html, array $block ): string {
    if ( ! str_contains( $block['attrs']['className'] ?? '', 'mgl-native-logo' ) || has_custom_logo() ) {
        return $html;
    }
    $base = get_theme_file_uri( 'media/branding/' );
    return '<div class="wp-block-site-logo mgl-native-logo"><a href="' . esc_url( home_url( '/' ) ) . '" class="custom-logo-link" rel="home"><img class="mgl-native-logo-dark" src="' . esc_url( $base . 'logo-dark.svg' ) . '" width="218" height="45" alt="Meta Grey Label"><img class="mgl-native-logo-light" src="' . esc_url( $base . 'logo-light.svg' ) . '" width="218" height="45" alt="Meta Grey Label"></a></div>';
}, 10, 2 );
