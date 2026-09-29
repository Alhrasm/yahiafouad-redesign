<?php
/**
 * Plugin Name: YF Booking Bridge
 * Description: Pre-fills the existing JetEngine/JetAppointments booking form from the new guided booking wizard. Does not change booking, pricing or checkout logic.
 * Version:     1.0.0
 *
 * Install: copy this file and yf-booking-bridge.js into wp-content/mu-plugins/.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', function () {
	// Booking engine pages (both existing pages carry the same form #5964).
	if ( ! is_page( array( 'booking-app', 'booking-ap' ) ) ) {
		return;
	}
	wp_enqueue_script(
		'yf-booking-bridge',
		content_url( 'mu-plugins/yf-booking-bridge.js' ),
		array( 'jquery' ),
		'1.0.0',
		true
	);
} );
