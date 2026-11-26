<?php
/**
 * Meta Grey Label release integration. WordPress APIs; no third-party service.
 */
defined( 'ABSPATH' ) || exit;
function mgl_release_is_contact() { return is_page( 'contact' ); }
function mgl_release_meta() {
    static $map;
    if ( null === $map ) { $map = json_decode( (string) file_get_contents( __DIR__ . '/release-meta.json' ), true ) ?: array(); }
    return $map;
}
function mgl_release_page_meta() {
    $route = get_post_meta( get_queried_object_id(), '_pin_structured_route', true );
    if ( ! $route && is_page() ) { $route = '/' . trim( get_page_uri( get_queried_object_id() ), '/' ) . '/'; }
    if ( is_front_page() ) { $route = '/'; }
    return mgl_release_meta()[ $route ] ?? array();
}
add_filter( 'pre_get_document_title', static function ( $title ) {
    if ( is_admin() || ! is_singular( 'page' ) || defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'AIOSEO_VERSION' ) ) { return $title; }
    return mgl_release_page_meta()['title'] ?? $title;
}, 20 );
add_action( 'wp_head', static function () {
    if ( ! has_site_icon() ) {
        $icon = get_theme_file_uri( '/source/assets/media/branding/theme-2/favicon-dark.svg' );
        echo '<link rel="icon" type="image/svg+xml" href="' . esc_url( $icon ) . '">' . "\n";
    }
    if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'AIOSEO_VERSION' ) || ! is_singular() ) { return; }
    $meta = mgl_release_page_meta();
    $description = $meta['description'] ?? wp_trim_words( wp_strip_all_tags( get_the_excerpt( get_queried_object_id() ) ), 28 );
    $title = wp_get_document_title();
    if ( $description ) { echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n"; }
    $properties = array( 'og:title' => $title, 'og:description' => $description, 'og:type' => is_singular( 'post' ) ? 'article' : 'website', 'og:url' => get_permalink( get_queried_object_id() ), 'og:image' => get_the_post_thumbnail_url( get_queried_object_id(), 'large' ) ?: get_theme_file_uri( '/source/assets/media/branding/theme-2/icon-512.png' ) );
    foreach ( $properties as $key => $value ) { if ( $value ) { echo '<meta property="' . esc_attr( $key ) . '" content="' . esc_attr( $value ) . '">' . "\n"; } }
}, 12 );
add_filter( 'query_loop_block_query_vars', static function ( $query, $block ) {
    if ( ( $block->attributes['namespace'] ?? '' ) !== 'mgl/related' || ! is_singular( 'post' ) ) { return $query; }
    $id = get_queried_object_id();
    $query['post__not_in'] = array( $id );
    $categories = wp_get_post_categories( $id );
    if ( $categories ) { $query['category__in'] = $categories; }
    return $query;
}, 10, 2 );
add_action( 'wp_enqueue_scripts', static function () {
    wp_enqueue_style( 'mgl-release', get_theme_file_uri( '/release.css' ), array(), '0.0.1' );
    if ( mgl_release_is_contact() ) {
        wp_enqueue_script( 'mgl-enquiry', get_theme_file_uri( '/release-enquiry.js' ), array(), '0.0.1', true );
        wp_localize_script( 'mgl-enquiry', 'MGLEnquiry', array( 'url' => admin_url( 'admin-post.php' ), 'nonce' => wp_create_nonce( 'mgl_enquiry' ), 'enabled' => (bool) get_option( 'mgl_enquiry_enabled', false ) ) );
    }
}, 110 );
add_action( 'enqueue_block_assets', static function () { if ( is_admin() ) { wp_enqueue_style( 'mgl-release-editor', get_theme_file_uri( '/release.css' ), array(), '0.0.1' ); } } );
add_action( 'admin_menu', static function () { add_submenu_page( 'pin-local-setup', 'Enquiry delivery', 'Enquiry delivery', 'manage_options', 'mgl-enquiry-settings', 'mgl_release_settings' ); } );
add_action( 'admin_init', static function () {
    register_setting( 'mgl_enquiry', 'mgl_enquiry_enabled', array( 'type' => 'boolean', 'sanitize_callback' => static function ( $v ) { return (bool) $v; }, 'default' => false ) );
    register_setting( 'mgl_enquiry', 'mgl_enquiry_recipient', array( 'type' => 'string', 'sanitize_callback' => 'sanitize_email' ) );
} );
function mgl_release_settings() {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    echo '<div class="wrap"><h1>Enquiry delivery</h1><p>Enable only after verifying WordPress mail or configuring a supported SMTP plugin. The recipient is never exposed to visitors.</p><form action="options.php" method="post">';
    settings_fields( 'mgl_enquiry' );
    echo '<table class="form-table"><tr><th scope="row"><label for="mgl_recipient">Recipient email</label></th><td><input class="regular-text" type="email" id="mgl_recipient" name="mgl_enquiry_recipient" value="' . esc_attr( get_option( 'mgl_enquiry_recipient', get_option( 'admin_email' ) ) ) . '"></td></tr><tr><th scope="row">Enable delivery</th><td><input type="hidden" name="mgl_enquiry_enabled" value="0"><label><input type="checkbox" name="mgl_enquiry_enabled" value="1" ' . checked( get_option( 'mgl_enquiry_enabled', false ), true, false ) . '> Allow visitors to submit reviewed enquiries</label></td></tr></table>';
    submit_button();
    echo '</form></div>';
}
function mgl_release_send_enquiry() {
    if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! check_ajax_referer( 'mgl_enquiry', 'nonce', false ) ) { wp_send_json_error( array( 'message' => 'Refresh the contact page and try again.' ), 403 ); }
    if ( ! get_option( 'mgl_enquiry_enabled', false ) ) { wp_send_json_error( array( 'message' => 'Email delivery is not enabled. You can still copy your brief.' ), 503 ); }
    if ( ! empty( $_POST['website'] ) ) { wp_send_json_error( array( 'message' => 'Invalid submission.' ), 400 ); }
    $summary = isset( $_POST['summary'] ) && is_string( $_POST['summary'] ) ? sanitize_textarea_field( wp_unslash( $_POST['summary'] ) ) : '';
    $consent = isset( $_POST['consent'] ) && '1' === $_POST['consent'];
    if ( ! $consent || strlen( $summary ) < 20 || strlen( $summary ) > 12000 ) { wp_send_json_error( array( 'message' => 'Review your brief and confirm submission.' ), 400 ); }
    $recipient = sanitize_email( get_option( 'mgl_enquiry_recipient', get_option( 'admin_email' ) ) );
    if ( ! is_email( $recipient ) ) { wp_send_json_error( array( 'message' => 'Enquiry delivery is not configured.' ), 503 ); }
    $key = 'mgl_enquiry_' . substr( hash_hmac( 'sha256', (string) ( $_SERVER['REMOTE_ADDR'] ?? 'unknown' ), wp_salt() ), 0, 32 );
    if ( get_transient( $key ) ) { wp_send_json_error( array( 'message' => 'Please wait one minute before sending another enquiry.' ), 429 ); }
    set_transient( $key, 1, MINUTE_IN_SECONDS );
    if ( ! wp_mail( $recipient, 'Meta Grey Label — brokerage enquiry', $summary ) ) {
        delete_transient( $key );
        wp_send_json_error( array( 'message' => 'The mail service could not accept this enquiry. Copy your brief and try again later.' ), 502 );
    }
    wp_send_json_success( array( 'message' => 'Your enquiry was accepted by the website mail service.' ) );
}
add_action( 'admin_post_mgl_send_enquiry', 'mgl_release_send_enquiry' );
add_action( 'admin_post_nopriv_mgl_send_enquiry', 'mgl_release_send_enquiry' );
