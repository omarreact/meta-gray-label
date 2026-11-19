<?php
/**
 * Isolated WordPress hook/asset smoke test. This tests the real registered
 * callbacks without installing WordPress. It is not browser parity testing.
 */
define( 'ABSPATH', __DIR__ );
$root = dirname( __DIR__ );
$hooks = array();
$registered = array();
$styles = array();
$scripts = array();
$native = true;
$site_icon = false;

function add_action( $name, $callback, $priority = 10 ) {
    global $hooks; $hooks[ $name ][] = $callback;
}
function add_filter( $name, $callback, $priority = 10 ) {
    add_action( $name, $callback, $priority );
}
function hook( $name ) {
    global $hooks;
    foreach ( $hooks[ $name ] ?? array() as $cb ) {
        $cb();
    }
}
function get_theme_file_path( $p = '' ) { global $root; return $root . '/' . $p; }
function get_theme_file_uri( $p = '' ) { return 'https://example.test/wp-content/themes/mgl/' . $p; }
function get_stylesheet_uri() { return get_theme_file_uri( 'style.css' ); }
function register_block_type( $directory, $args ) {
    global $registered;
    $name = json_decode( file_get_contents( $directory . '/block.json' ), true )['name'] ?? null;
    if ( ! $name || empty( $args['render_callback'] ) ) {
        throw new RuntimeException( 'Invalid block metadata registration: ' . $directory );
    }
    $registered[] = $name;
}
function add_theme_support( $feature ) {}
function add_editor_style( $file ) {}
function is_page() { return true; }
function is_front_page() { return false; }
function is_404() { return false; }
function get_queried_object_id() { return 10; }
function get_post_meta( $id, $key, $single = true ) {
    global $native;
    return $key === '_mgl_native_layout' && $native ? '1' : '';
}
function is_page_template( $template ) { return false; }
function get_page_uri( $id ) { return 'about-us'; }
function wp_enqueue_style( $handle, $src, $deps, $ver ) {
    global $styles;
    $styles[ $handle ] = $src;
}
function wp_enqueue_script( $handle, $src, $deps, $ver, $footer ) {
    global $scripts;
    $scripts[ $handle ] = $src;
}
function sanitize_key( $value ) {
    return strtolower( preg_replace( '/[^a-z0-9_-]/i', '', $value ) );
}
function has_site_icon() { global $site_icon; return $site_icon; }
function esc_attr( $s ) { return htmlspecialchars( $s, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $s ) { return $s; }
function wp_strip_all_tags( $s ) { return strip_tags( $s ); }
function get_queried_object() { return null; }

require $root . '/functions.php';
hook( 'after_setup_theme' );
hook( 'init' );
sort( $registered );
if ( $registered !== array( 'mgl/footer', 'mgl/header', 'mgl/page' ) ) {
    throw new RuntimeException( 'Expected 3 metadata-registered fallback blocks.' );
}

hook( 'wp_enqueue_scripts' );
if ( array_keys( $styles ) !== array( 'mgl-fse-native' ) || count( $scripts ) !== 0 ) {
    throw new RuntimeException( 'Native pages loaded legacy CSS/JS unexpectedly.' );
}
$native = false;
$styles = array();
$scripts = array();
hook( 'wp_enqueue_scripts' );
if ( count( $styles ) !== 6 || count( $scripts ) !== 6 ) {
    throw new RuntimeException( 'Legacy assets were removed or duplicated.' );
}
foreach ( array_keys( $styles ) as $handle ) {
    if ( $handle === 'mgl-fse-native' ) {
        throw new RuntimeException( 'Native stylesheet leaks into fallback.' );
    }
}

$native = true;
$title = $hooks['pre_get_document_title'][0]( 'WordPress Page Title' );
if ( $title !== 'WordPress Page Title' ) {
    throw new RuntimeException( 'Native WordPress document title was overridden.' );
}
$native = false;
$title = $hooks['pre_get_document_title'][0]( 'WordPress Page Title' );
if ( ! str_contains( $title, 'Meta' ) ) {
    throw new RuntimeException( 'Legacy SEO title lookup failed.' );
}

ob_start();
hook( 'wp_head' );
$head = ob_get_clean();
if ( substr_count( $head, 'name="description"' ) !== 1 ||
    substr_count( $head, 'rel="icon"' ) !== 1 ||
    str_contains( $head, 'rel="canonical"' ) ) {
    throw new RuntimeException( 'WordPress head has duplicate, missing, or hard-coded SEO signals.' );
}

$site_icon = true;
ob_start();
hook( 'wp_head' );
$head_with_site_icon = ob_get_clean();
if ( str_contains( $head_with_site_icon, 'rel="icon"' ) ) {
    throw new RuntimeException( 'Theme overrides configured WordPress Site Icon.' );
}
echo "WORDPRESS ASSET/SEO SMOKE PASS: native CSS only, legacy preserved, 3 metadata blocks, core canonical.\n";
