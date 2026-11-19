<?php
/**
 * Runtime smoke test using basic WordPress function stubs.
 * Not a substitute for a full WordPress browser/visual parity test.
 */
define( 'ABSPATH', __DIR__ );
$root = dirname( __DIR__ );
$test_route = '/';
function get_theme_file_path( $path = '' ) { global $root; return $root . '/' . $path; }
function get_theme_file_uri( $path = '' ) { return 'https://example.test/wp-content/themes/meta-grey-label/' . $path; }
function home_url( $path = '/' ) { return 'https://example.test' . $path; }
function esc_attr( $value ) { return htmlspecialchars( $value, ENT_QUOTES, 'UTF-8' ); }
function is_404() { global $test_route; return '/404.html' === $test_route; }
function is_front_page() { global $test_route; return '/' === $test_route; }
function is_page() { global $test_route; return '/' !== $test_route && '/404.html' !== $test_route; }
function get_queried_object_id() { return 1; }
function get_page_uri( $id ) { global $test_route; return trim( $test_route, '/' ); }
function apply_filters( $key, $content ) { return $content; }
function get_queried_object() { return null; }
function is_singular() { return false; }

require $root . '/inc/renderer.php';
$pages = mgl_content_data()['pages'];
$verified = 0;
foreach ( $pages as $file => $record ) {
    if ( $record['role'] !== 'page' ) {
        continue;
    }
    $test_route = $record['route'];
    $markup = mgl_template_markup( $file );
    if ( '' === $markup || str_contains( $markup, '__MGL_CONTENT_' ) ) {
        throw new RuntimeException( 'Invalid source template: ' . $file );
    }
    $html = mgl_render_page();
    if ( '' === $html || str_contains( $html, '__MGL_CONTENT_' ) ) {
        throw new RuntimeException( 'Missing rendered page: ' . $file );
    }
    if ( ! str_contains( $html, 'https://example.test/wp-content/themes/meta-grey-label/' ) ) {
        throw new RuntimeException( 'Theme assets were not rewritten: ' . $file );
    }
    $verified++;
}
if ( 52 !== $verified ) {
    throw new RuntimeException( 'Wrong page count: ' . $verified );
}
$h = mgl_render_header();
$f = mgl_render_footer();
if ( ! str_contains( $h, '<header' ) || ! str_contains( $f, '<footer' ) ) {
    throw new RuntimeException( 'Shared parts not rendered.' );
}
if ( ! str_contains( $h, 'https://example.test/wp-content/themes/meta-grey-label/media/branding/' ) ) {
    throw new RuntimeException( 'Header branding asset URL not rewritten.' );
}
echo 'WORDPRESS PHP RENDERER SMOKE PASS: ' . $verified . " pages and shared parts.\n";
