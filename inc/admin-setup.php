<?php
defined( 'ABSPATH' ) || exit;

function mgl_setup_page_url( array $args = array() ): string {
    return add_query_arg( $args, admin_url( 'themes.php?page=mgl-setup' ) );
}

add_action( 'admin_menu', static function (): void {
    add_theme_page(
        'Meta Grey Label Setup',
        'Meta Grey Label Setup',
        'edit_theme_options',
        'mgl-setup',
        'mgl_render_setup_page'
    );
} );

add_action( 'admin_post_mgl_import_pages', static function (): void {
    if ( ! current_user_can( 'edit_theme_options' ) ) {
        wp_die( esc_html__( 'You do not have permission to configure this theme.', 'meta-grey-label' ), '', array( 'response' => 403 ) );
    }

    check_admin_referer( 'mgl_import_pages' );

    $result = mgl_import_native_pages( true, true );
    if ( is_wp_error( $result ) ) {
        set_transient(
            'mgl_setup_error_' . get_current_user_id(),
            $result->get_error_message(),
            MINUTE_IN_SECONDS
        );
        wp_safe_redirect( mgl_setup_page_url( array( 'mgl_status' => 'error' ) ) );
        exit;
    }

    flush_rewrite_rules( false );

    wp_safe_redirect(
        mgl_setup_page_url(
            array(
                'mgl_status' => 'imported',
                'created'    => (int) $result['created'],
                'existing'   => (int) $result['existing'],
            )
        )
    );
    exit;
} );

function mgl_render_setup_page(): void {
    if ( ! current_user_can( 'edit_theme_options' ) ) {
        return;
    }

    $preview = mgl_import_native_pages( false, false );
    $status  = isset( $_GET['mgl_status'] ) ? sanitize_key( wp_unslash( $_GET['mgl_status'] ) ) : '';
    $created = isset( $_GET['created'] ) ? absint( $_GET['created'] ) : 0;

    echo '<div class="wrap">';
    echo '<h1>' . esc_html__( 'Meta Grey Label Setup', 'meta-grey-label' ) . '</h1>';
    echo '<p>' . esc_html__( 'Install the packaged native Gutenberg pages and configure the homepage without using WP-CLI.', 'meta-grey-label' ) . '</p>';

    if ( 'imported' === $status ) {
        echo '<div class="notice notice-success is-dismissible"><p>';
        echo esc_html(
            sprintf(
                /* translators: %d: number of pages created */
                __( 'Setup complete. %d missing page(s) were created. Existing pages were not overwritten.', 'meta-grey-label' ),
                $created
            )
        );
        echo '</p></div>';
    } elseif ( 'error' === $status ) {
        $error = get_transient( 'mgl_setup_error_' . get_current_user_id() );
        delete_transient( 'mgl_setup_error_' . get_current_user_id() );
        if ( $error ) {
            echo '<div class="notice notice-error"><p>' . esc_html( $error ) . '</p></div>';
        }
    }

    if ( is_wp_error( $preview ) ) {
        echo '<div class="notice notice-error"><p>' . esc_html( $preview->get_error_message() ) . '</p></div></div>';
        return;
    }

    $missing = (int) $preview['planned'];
    $home_id = (int) get_option( 'page_on_front' );

    echo '<div class="card" style="max-width:760px;padding:24px;margin-top:20px">';
    echo '<h2 style="margin-top:0">' . esc_html__( 'Native site content', 'meta-grey-label' ) . '</h2>';
    echo '<p><strong>' . esc_html__( 'Missing pages:', 'meta-grey-label' ) . '</strong> ' . esc_html( (string) $missing ) . '</p>';
    echo '<p><strong>' . esc_html__( 'Static homepage configured:', 'meta-grey-label' ) . '</strong> ' . esc_html( $home_id ? __( 'Yes', 'meta-grey-label' ) : __( 'No', 'meta-grey-label' ) ) . '</p>';
    echo '<p>' . esc_html__( 'The importer creates only missing pages from the packaged block files, preserves any pages that already exist, and sets the packaged Home page as the static front page.', 'meta-grey-label' ) . '</p>';

    echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
    echo '<input type="hidden" name="action" value="mgl_import_pages">';
    wp_nonce_field( 'mgl_import_pages' );
    submit_button(
        $missing > 0
            ? __( 'Import Missing Pages & Set Homepage', 'meta-grey-label' )
            : __( 'Verify Pages & Set Homepage', 'meta-grey-label' ),
        'primary',
        'submit',
        false
    );
    echo '</form>';
    echo '</div>';

    echo '<div class="card" style="max-width:760px;padding:24px;margin-top:20px">';
    echo '<h2 style="margin-top:0">' . esc_html__( 'After setup', 'meta-grey-label' ) . '</h2>';
    echo '<ol>';
    echo '<li>' . esc_html__( 'Open Pages to review the imported native Gutenberg pages.', 'meta-grey-label' ) . '</li>';
    echo '<li>' . esc_html__( 'Open Appearance → Editor to review the header, footer and templates.', 'meta-grey-label' ) . '</li>';
    echo '<li>' . esc_html__( 'Use the site frontend to verify light/dark theme behavior and responsive layouts.', 'meta-grey-label' ) . '</li>';
    echo '</ol>';
    echo '</div>';
    echo '</div>';
}
