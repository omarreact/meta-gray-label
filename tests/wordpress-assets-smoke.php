<?php
define( 'ABSPATH', __DIR__ );
$root = dirname( __DIR__ );
$hooks = array();
$styles = array();
$scripts = array();
$site_icon = false;
function add_filter( $name, $callback, $priority = 10, $args = 1 ) {}
function add_action( $name, $callback, $priority = 10 ) { global $hooks; $hooks[$name][]=$callback; }
function hook( $name ) { global $hooks; foreach ( $hooks[$name] ?? array() as $cb ) { $cb(); } }
function get_theme_file_path( $p = '' ) { global $root; return $root . '/' . $p; }
function get_theme_file_uri( $p = '' ) { return 'https://example.test/wp-content/themes/mgl/' . $p; }
function add_theme_support( $feature ) {}
function add_editor_style( $file ) {}
function wp_enqueue_style( $handle, $src, $deps, $ver ) { global $styles; $styles[$handle]=$src; }
function wp_enqueue_script( $handle, $src, $deps, $ver, $in_footer ) { global $scripts; $scripts[$handle]=$src; }
function has_site_icon() { global $site_icon; return $site_icon; }
function esc_url( $s ) { return $s; }

require $root . '/functions.php';
hook( 'after_setup_theme' );
hook( 'wp_enqueue_scripts' );
if ( array_keys( $styles ) !== array( 'mgl-fse-native', 'mgl-site-settings', 'mgl-inner-system', 'mgl-directories', 'mgl-native-chrome' ) ||
     ! str_contains( $styles['mgl-fse-native'], 'assets/css/fse.css' ) ||
     ! str_contains( $styles['mgl-site-settings'], 'assets/css/site-settings.css' ) ||
     ! str_contains( $styles['mgl-inner-system'], 'assets/css/inner-pages.css' ) ) {
    throw new RuntimeException( 'Native stylesheet configuration failed.' );
}
if ( array_keys( $scripts ) !== array( 'mgl-native-chrome', 'mgl-site-settings' ) ||
     ! str_contains( $scripts['mgl-site-settings'], 'assets/js/site-settings.js' ) ) {
    throw new RuntimeException( 'Site settings script configuration failed.' );
}
ob_start(); hook( 'wp_head' ); $head=ob_get_clean();
if ( substr_count( $head, 'rel="icon"' ) !== 1 || str_contains( $head, 'rel="canonical"' ) ) {
    throw new RuntimeException( 'Favicon/canonical ownership invalid.' );
}
$site_icon=true;
ob_start(); hook( 'wp_head' ); $head=ob_get_clean();
if ( str_contains( $head, 'rel="icon"' ) ) throw new RuntimeException( 'Configured Site Icon must win.' );
echo "WORDPRESS ASSET PASS: native theme plus isolated site-settings assets, no legacy framework bundle, core owns canonical.\n";
