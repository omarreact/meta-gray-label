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
} );

add_action( 'wp_enqueue_scripts', static function (): void {
    wp_enqueue_style(
        'mgl-fse-native',
        get_theme_file_uri( 'assets/css/fse.css' ),
        array(),
        '1.0.0'
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
