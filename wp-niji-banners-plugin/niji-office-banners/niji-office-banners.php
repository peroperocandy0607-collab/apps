<?php
/**
 * Plugin Name: Niji Office 占い記事バナー
 * Description: 選んだカテゴリーの記事に、記事上バナー（天使／過去世）と記事下バナー（霊性開花）を自動で表示します。設定は「設定 → 占い記事バナー」から。
 * Version:     2.0.0
 * Author:      Niji Office
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'NIJI_OB_OPTION', 'niji_ob_settings' );
define( 'NIJI_OB_MEDIA', 'niji_ob_attachments' );

/**
 * 同梱バナー（画像ファイル名 => 表示名・代替テキスト）
 */
function niji_ob_banners() {
	return array(
		'tenshi' => array(
			'file'  => 'banner-tenshi.webp',
			'label' => '記事上：わたし、天使なの？',
			'alt'   => 'わたし、天使なの？ 波動・チャクラ・サードアイ｜Niji Office',
		),
		'kakoze' => array(
			'file'  => 'banner-kakoze.webp',
			'label' => '記事上：僕の過去世',
			'alt'   => '僕の過去世 波動・チャクラ・サードアイ｜Niji Office',
		),
		'reisei' => array(
			'file'  => 'banner-reisei.webp',
			'label' => '記事下：霊性開花',
			'alt'   => '霊性開花 波動・チャクラ・サードアイ｜Niji Office',
		),
	);
}

function niji_ob_settings() {
	$defaults = array(
		'categories' => array(),
		'top_mode'   => 'alternate',
		'urls'       => array( 'tenshi' => '', 'kakoze' => '', 'reisei' => '' ),
	);
	$saved = get_option( NIJI_OB_OPTION, array() );
	$s     = wp_parse_args( is_array( $saved ) ? $saved : array(), $defaults );
	$s['urls'] = wp_parse_args( (array) $s['urls'], $defaults['urls'] );
	return $s;
}

/* =========================================================
 * 有効化したとき：画像をメディアライブラリへアップロード
 * ========================================================= */

function niji_ob_attachment_id( $key ) {
	$ids = get_option( NIJI_OB_MEDIA, array() );
	if ( ! empty( $ids[ $key ] ) && 'attachment' === get_post_type( $ids[ $key ] ) ) {
		return (int) $ids[ $key ];
	}
	return 0;
}

function niji_ob_import_images() {
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$ids = get_option( NIJI_OB_MEDIA, array() );
	foreach ( niji_ob_banners() as $key => $b ) {
		if ( niji_ob_attachment_id( $key ) ) {
			continue;
		}
		$source = __DIR__ . '/images/' . $b['file'];
		if ( ! file_exists( $source ) ) {
			continue;
		}
		$tmp = wp_tempnam( $b['file'] );
		copy( $source, $tmp );
		$id = media_handle_sideload( array( 'name' => $b['file'], 'tmp_name' => $tmp ), 0, $b['alt'] );
		if ( is_wp_error( $id ) ) {
			@unlink( $tmp );
			continue;
		}
		update_post_meta( $id, '_wp_attachment_image_alt', $b['alt'] );
		$ids[ $key ] = $id;
	}
	update_option( NIJI_OB_MEDIA, $ids, false );
}
register_activation_hook( __FILE__, 'niji_ob_import_images' );

// 画像がメディアから削除されていたら、管理画面を開いたときに入れ直す
add_action(
	'admin_init',
	function () {
		if ( ! current_user_can( 'upload_files' ) ) {
			return;
		}
		foreach ( array_keys( niji_ob_banners() ) as $key ) {
			if ( ! niji_ob_attachment_id( $key ) ) {
				niji_ob_import_images();
				return;
			}
		}
	}
);

/* =========================================================
 * 設定画面（設定 → 占い記事バナー）
 * ========================================================= */

add_action(
	'admin_menu',
	function () {
		add_options_page( '占い記事バナー', '占い記事バナー', 'manage_options', 'niji-ob', 'niji_ob_settings_page' );
	}
);

add_filter(
	'plugin_action_links_' . plugin_basename( __FILE__ ),
	function ( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=niji-ob' ) ) . '">設定</a>' );
		return $links;
	}
);

add_action(
	'admin_init',
	function () {
		register_setting(
			'niji_ob',
			NIJI_OB_OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => 'niji_ob_sanitize',
			)
		);
	}
);

function niji_ob_sanitize( $in ) {
	$in  = is_array( $in ) ? $in : array();
	$out = array(
		'categories' => array_values( array_filter( array_map( 'absint', isset( $in['categories'] ) ? (array) $in['categories'] : array() ) ) ),
		'top_mode'   => ( isset( $in['top_mode'] ) && in_array( $in['top_mode'], array( 'alternate', 'tenshi', 'kakoze' ), true ) ) ? $in['top_mode'] : 'alternate',
		'urls'       => array(),
	);
	foreach ( array_keys( niji_ob_banners() ) as $key ) {
		$out['urls'][ $key ] = isset( $in['urls'][ $key ] ) ? esc_url_raw( trim( $in['urls'][ $key ] ) ) : '';
	}
	return $out;
}

/**
 * 親カテゴリーの直下に子カテゴリーが並ぶ順で取得
 */
function niji_ob_sorted_categories( $parent = 0, $depth = 0 ) {
	$out = array();
	foreach ( get_categories( array( 'hide_empty' => false, 'parent' => $parent ) ) as $c ) {
		$c->niji_depth = $depth;
		$out[]         = $c;
		$out           = array_merge( $out, niji_ob_sorted_categories( $c->term_id, $depth + 1 ) );
	}
	return $out;
}

function niji_ob_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s       = niji_ob_settings();
	$banners = niji_ob_banners();
	$cats    = niji_ob_sorted_categories();
	$name    = NIJI_OB_OPTION;
	?>
	<div class="wrap">
		<h1>占い記事バナー</h1>
		<p>チェックしたカテゴリーの記事に、<b>記事上</b>（天使／過去世）と<b>記事の一番下</b>（霊性開花）のバナーが自動で表示されます。子カテゴリーの記事にも表示されます。</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'niji_ob' ); ?>

			<h2>① 表示するカテゴリー</h2>
			<div style="background:#fff;border:1px solid #ccd0d4;padding:12px 16px;max-height:320px;overflow:auto;max-width:640px;">
				<?php if ( ! $cats ) : ?>
					<p>カテゴリーがありません。</p>
				<?php endif; ?>
				<?php foreach ( $cats as $c ) : ?>
					<label style="display:block;margin:6px 0;">
						<input type="checkbox" name="<?php echo esc_attr( $name ); ?>[categories][]" value="<?php echo esc_attr( $c->term_id ); ?>" <?php checked( in_array( (int) $c->term_id, $s['categories'], true ) ); ?>>
						<?php echo esc_html( str_repeat( '　', $c->niji_depth ) . ( $c->niji_depth ? '└ ' : '' ) . $c->name ); ?>
						<span style="color:#888;">（<?php echo (int) $c->count; ?>記事）</span>
					</label>
				<?php endforeach; ?>
			</div>

			<h2>② 「詳細を視る」を押したときのリンク先</h2>
			<table class="form-table" role="presentation">
				<?php foreach ( $banners as $key => $b ) : ?>
					<?php $id = niji_ob_attachment_id( $key ); ?>
					<tr>
						<th scope="row"><?php echo esc_html( $b['label'] ); ?></th>
						<td>
							<?php if ( $id ) : ?>
								<?php echo wp_get_attachment_image( $id, 'medium', false, array( 'style' => 'display:block;margin-bottom:8px;border-radius:6px;max-width:300px;height:auto;' ) ); ?>
							<?php endif; ?>
							<input type="url" class="regular-text" placeholder="https://" name="<?php echo esc_attr( $name ); ?>[urls][<?php echo esc_attr( $key ); ?>]" value="<?php echo esc_attr( $s['urls'][ $key ] ); ?>">
							<?php if ( '' === $s['urls'][ $key ] ) : ?>
								<p class="description" style="color:#b32d2e;">未入力のあいだ、このバナーは表示されません。</p>
							<?php endif; ?>
						</td>
					</tr>
				<?php endforeach; ?>
			</table>

			<h2>③ 記事上バナーの出し方</h2>
			<fieldset>
				<label style="display:block;margin:6px 0;"><input type="radio" name="<?php echo esc_attr( $name ); ?>[top_mode]" value="alternate" <?php checked( $s['top_mode'], 'alternate' ); ?>> 記事ごとに天使と過去世を交互に表示（おすすめ）</label>
				<label style="display:block;margin:6px 0;"><input type="radio" name="<?php echo esc_attr( $name ); ?>[top_mode]" value="tenshi" <?php checked( $s['top_mode'], 'tenshi' ); ?>> すべて「天使」</label>
				<label style="display:block;margin:6px 0;"><input type="radio" name="<?php echo esc_attr( $name ); ?>[top_mode]" value="kakoze" <?php checked( $s['top_mode'], 'kakoze' ); ?>> すべて「過去世」</label>
			</fieldset>

			<?php submit_button( '保存する' ); ?>
		</form>
		<p style="color:#666;">キャッシュ系プラグインをお使いの場合は、保存後にキャッシュを削除すると、すぐ反映されます。</p>
	</div>
	<?php
}

/* =========================================================
 * 記事への表示
 * ========================================================= */

function niji_ob_is_target_post( $post_id, $cat_ids ) {
	if ( ! $cat_ids ) {
		return false;
	}
	$all = $cat_ids;
	foreach ( $cat_ids as $cid ) {
		$children = get_term_children( $cid, 'category' );
		if ( ! is_wp_error( $children ) ) {
			$all = array_merge( $all, $children );
		}
	}
	return in_category( array_map( 'intval', $all ), $post_id );
}

function niji_ob_html( $key, $url, $position ) {
	if ( '' === $url ) {
		return '';
	}
	$b    = niji_ob_banners()[ $key ];
	$attr = array(
		'class'    => 'niji-ob__img',
		'alt'      => $b['alt'],
		'loading'  => 'top' === $position ? 'eager' : 'lazy',
		'decoding' => 'async',
		'sizes'    => '(max-width: 800px) 100vw, 800px',
	);
	$id = niji_ob_attachment_id( $key );
	if ( $id ) {
		$img = wp_get_attachment_image( $id, 'full', false, $attr );
	} else {
		$img = sprintf(
			'<img src="%1$s" alt="%2$s" width="1400" height="560" loading="%3$s" decoding="async" class="niji-ob__img">',
			esc_url( plugins_url( 'images/' . $b['file'], __FILE__ ) ),
			esc_attr( $b['alt'] ),
			esc_attr( $attr['loading'] )
		);
	}
	return sprintf(
		'<div class="niji-ob niji-ob--%1$s"><a href="%2$s">%3$s</a></div>',
		esc_attr( $position ),
		esc_url( $url ),
		$img
	);
}

function niji_ob_insert( $content ) {
	if ( is_admin() || is_feed() || ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	$post_id = get_the_ID();
	$s       = niji_ob_settings();
	if ( ! $post_id || ! niji_ob_is_target_post( $post_id, $s['categories'] ) ) {
		return $content;
	}
	if ( get_post_meta( $post_id, 'niji_banner_off', true ) ) {
		return $content;
	}

	if ( 'tenshi' === $s['top_mode'] || 'kakoze' === $s['top_mode'] ) {
		$top = $s['top_mode'];
	} else {
		$top = ( 0 === $post_id % 2 ) ? 'tenshi' : 'kakoze';
	}

	return niji_ob_html( $top, $s['urls'][ $top ], 'top' ) . $content . niji_ob_html( 'reisei', $s['urls']['reisei'], 'bottom' );
}
add_filter( 'the_content', 'niji_ob_insert', 20 );

add_action(
	'wp_head',
	function () {
		if ( ! is_singular( 'post' ) ) {
			return;
		}
		echo '<style id="niji-ob-css">.niji-ob{margin:0 0 2em;line-height:0}.niji-ob--bottom{margin:2.5em 0 1em}.niji-ob a{display:block;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(120,100,180,.18);transition:transform .2s,box-shadow .2s}.niji-ob a:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(120,100,180,.28)}.niji-ob img{display:block;width:100%;height:auto;max-width:100%;margin:0;border:0}</style>';
	}
);
