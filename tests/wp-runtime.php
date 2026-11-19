<?php
/** Integration checks run via WP-CLI in isolated wp-env WordPress. */
if ( ! defined( 'ABSPATH' ) ) { exit( 1 ); }
$theme = wp_get_theme();
if ( 'Meta Grey Label' !== $theme->get( 'Name' ) || ! wp_is_block_theme() ) {
    WP_CLI::error( 'Meta Grey Label was not recognized as an active block theme.' );
}
$registry = WP_Block_Type_Registry::get_instance();
foreach ( array( 'mgl/page', 'mgl/header', 'mgl/footer' ) as $name ) {
    if ( ! $registry->is_registered( $name ) ) {
        WP_CLI::error( 'Block metadata not registered: ' . $name );
    }
}
$manifest = json_decode( (string) file_get_contents( get_theme_file_path( 'data/fse-pages/manifest.json' ) ), true );
if ( ! is_array( $manifest ) || count( $manifest['pages'] ?? array() ) !== 52 ) {
    WP_CLI::error( 'Native block manifest must contain all 52 routes.' );
}
$native = 0;
foreach ( $manifest['pages'] as $source => $record ) {
    if ( '404.html' === $source ) { continue; }
    $path = '/' === $record['route']
        ? 'home'
        : trim( preg_replace( '/\.html$/', '', $record['route'] ), '/' );
    $post = get_page_by_path( $path, OBJECT, 'page' );
    if ( ! $post instanceof WP_Post ) {
        WP_CLI::error( 'Missing imported WordPress Page: ' . $path );
    }
    if ( '1' !== get_post_meta( $post->ID, '_mgl_native_layout', true ) || ! has_blocks( $post->post_content ) ) {
        WP_CLI::error( 'Page is not Gutenberg-native: ' . $path );
    }
    $blocks = parse_blocks( $post->post_content );
    if ( ! count( $blocks ) || 'core/group' !== $blocks[0]['blockName'] ) {
        WP_CLI::error( 'WordPress parser rejected block structure: ' . $path );
    }
    $html = do_blocks( $post->post_content );
    if ( ! str_contains( $html, 'mgl-native-page' ) || ! str_contains( $html, '<h1' ) ) {
        WP_CLI::error( 'WordPress failed to render block content: ' . $path );
    }
    $native++;
}
if ( $native !== 51 || 'page' !== get_option( 'show_on_front' ) || ! get_option( 'page_on_front' ) ) {
    WP_CLI::error( 'Wrong native count or homepage configuration: ' . $native );
}
$part = (string) file_get_contents( get_theme_file_path( 'parts/header-native.html' ) );
$parsed = parse_blocks( $part );
if ( ! $parsed || $parsed[0]['blockName'] !== 'core/group' ) {
    WP_CLI::error( 'Editable Header does not parse as Gutenberg blocks.' );
}
if ( substr_count( $part, '<!-- wp:navigation-link' ) !== 38 ||
     substr_count( $part, '<!-- wp:navigation-submenu' ) !== 9 ) {
    WP_CLI::error( 'Missing menu/submenu nodes in native FSE header.' );
}
$rendered = do_blocks( $part );
if ( ! str_contains( $rendered, 'Solutions' ) || ! str_contains( $rendered, 'wp-block-navigation' ) ) {
    WP_CLI::error( 'WordPress did not render the native navigation.' );
}
WP_CLI::success( 'REAL WORDPRESS PASS: 51 native pages, 52 source routes, FSE navigation and core parsing.' );
