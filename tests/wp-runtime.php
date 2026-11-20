<?php
if ( ! defined( 'ABSPATH' ) ) { exit( 1 ); }
$theme = wp_get_theme();
if ( 'Meta Grey Label' !== $theme->get( 'Name' ) || ! wp_is_block_theme() ) {
    WP_CLI::error( 'Meta Grey Label was not recognized as a block theme.' );
}
$manifest = json_decode( (string) file_get_contents( get_theme_file_path( 'data/fse-pages/manifest.json' ) ), true );
if ( ! is_array( $manifest ) || count( $manifest['pages'] ?? array() ) !== 52 ) {
    WP_CLI::error( 'Native block manifest must contain all 52 routes.' );
}
$native=0;
foreach ( $manifest['pages'] as $source=>$record ) {
    if ( '404.html' === $source ) { continue; }
    $path = '/' === $record['route'] ? 'home' : trim( preg_replace( '/\.html$/', '', $record['route'] ), '/' );
    $post = get_page_by_path( $path, OBJECT, 'page' );
    if ( ! $post instanceof WP_Post || ! has_blocks( $post->post_content ) ) {
        WP_CLI::error( 'Missing native WordPress Page: ' . $path );
    }
    $blocks=parse_blocks($post->post_content);
    if ( ! count($blocks) || 'core/group' !== $blocks[0]['blockName'] ) {
        WP_CLI::error( 'Invalid block structure: ' . $path );
    }
    $html=do_blocks($post->post_content);
    if ( ! str_contains($html,'mgl-native-page') || ! str_contains($html,'<h1') ) {
        WP_CLI::error( 'WordPress render failed: ' . $path );
    }
    $native++;
}
if ( $native !== 51 || 'page' !== get_option('show_on_front') || ! get_option('page_on_front') ) {
    WP_CLI::error( 'Wrong native count/homepage configuration.' );
}
$part=(string)file_get_contents(get_theme_file_path('parts/header.html'));
if ( substr_count($part,'<!-- wp:navigation-link') !== 38 ||
     substr_count($part,'<!-- wp:navigation-submenu') !== 9 ) {
    WP_CLI::error( 'Native navigation inventory changed.' );
}
$parsed=parse_blocks($part);
if(!$parsed || $parsed[0]['blockName']!=='core/group') WP_CLI::error('Header does not parse.');
WP_CLI::success('REAL WORDPRESS PASS: 51 native Pages, 52 routes and native FSE header/footer.');
