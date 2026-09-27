<?php
/**
 * Plugin Name: Niji Office 占い記事バナー自動挿入
 * Description: 指定カテゴリー（エンジェルナンバー・365日誕生日占いなど）の記事に、記事上バナー（過去世 or 天使を交互）と記事下バナー（霊性開花）を一括で自動挿入します。
 * Version:     1.0.0
 * Author:      Niji Office
 *
 * 【設置方法】
 *   wp-content/mu-plugins/ に、このファイルと「niji-banners」フォルダ（画像3枚入り）をそのまま置くだけで有効になります。
 *   （mu-plugins フォルダが無ければ作成してください。有効化ボタンは不要です）
 *
 * 【最初に必ず設定する所】 すぐ下の「設定」の3か所だけです。
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* =========================================================
 * 設定（ここだけ書き換えてください）
 * ========================================================= */

/**
 * ① 対象カテゴリー
 *    カテゴリーの「スラッグ」「名前」「ID」のどれでもOK。
 *    ここに書いたカテゴリーの「子カテゴリー」に入っている記事も対象になります。
 *    例：array( 'angel-number', 'birthday' ) / array( 'エンジェルナンバー', '365日誕生日占い' ) / array( 12, 34 )
 */
function niji_banner_target_categories() {
	return array(
		'エンジェルナンバー',
		'365日誕生日占い',
	);
}

/**
 * ② 各バナーのリンク先URL（「詳細を視る」を押したときに飛ぶページ）
 */
function niji_banner_items() {
	return array(
		// 記事上（2枚を記事ごとに交互に表示）
		'top' => array(
			array(
				'img'  => 'banner-tenshi.webp',
				'alt'  => 'わたし、天使なの？ 波動・チャクラ・サードアイ｜Niji Office',
				'url'  => 'https://example.com/tenshi/', // ← 天使バナーのリンク先
			),
			array(
				'img'  => 'banner-kakoze.webp',
				'alt'  => '僕の過去世 波動・チャクラ・サードアイ｜Niji Office',
				'url'  => 'https://example.com/kakoze/', // ← 過去世バナーのリンク先
			),
		),
		// 記事下（まとめの下＝本文の最後）
		'bottom' => array(
			'img' => 'banner-reisei.webp',
			'alt' => '霊性開花 波動・チャクラ・サードアイ｜Niji Office',
			'url' => 'https://example.com/reisei/', // ← 霊性開花バナーのリンク先
		),
	);
}

/**
 * ③ 記事上バナーの出し方
 *    'alternate' … 記事IDで天使／過去世を交互に表示（キャッシュしても崩れない・おすすめ）
 *    'tenshi'    … 全記事「天使」で固定
 *    'kakoze'    … 全記事「過去世」で固定
 */
define( 'NIJI_BANNER_TOP_MODE', 'alternate' );

/* =========================================================
 * ここから下は触らなくてOK
 * ========================================================= */

/**
 * 記事が対象カテゴリー（子カテゴリー含む）に入っているか
 */
function niji_banner_is_target_post( $post_id ) {
	$targets = niji_banner_target_categories();
	if ( empty( $targets ) ) {
		return false;
	}

	// 直接そのカテゴリーに入っている
	if ( in_category( $targets, $post_id ) ) {
		return true;
	}

	// 子カテゴリーに入っている
	foreach ( $targets as $target ) {
		if ( is_numeric( $target ) ) {
			$term = get_term( (int) $target, 'category' );
		} else {
			$term = get_term_by( 'slug', $target, 'category' );
			if ( ! $term ) {
				$term = get_term_by( 'name', $target, 'category' );
			}
		}
		if ( $term && ! is_wp_error( $term ) && post_is_in_descendant_category( $term->term_id, $post_id ) ) {
			return true;
		}
	}
	return false;
}

/**
 * バナー1枚分のHTML
 */
function niji_banner_html( $item, $position ) {
	$src = plugins_url( 'niji-banners/' . $item['img'], __FILE__ );

	return sprintf(
		'<div class="niji-banner niji-banner--%1$s"><a href="%2$s"><img src="%3$s" alt="%4$s" width="1983" height="793" loading="%5$s" decoding="async"></a></div>',
		esc_attr( $position ),
		esc_url( $item['url'] ),
		esc_url( $src ),
		esc_attr( $item['alt'] ),
		'top' === $position ? 'eager' : 'lazy'
	);
}

/**
 * 本文の上下にバナーを差し込む
 */
function niji_banner_insert( $content ) {
	// 記事ページのメイン本文だけ（一覧・フィード・ウィジェット等には出さない）
	if ( is_admin() || is_feed() || ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}

	$post_id = get_the_ID();
	if ( ! $post_id || ! niji_banner_is_target_post( $post_id ) ) {
		return $content;
	}

	// 記事ごとにOFFにしたい場合：カスタムフィールド「niji_banner_off」に 1 を入れる
	if ( get_post_meta( $post_id, 'niji_banner_off', true ) ) {
		return $content;
	}

	$items = niji_banner_items();

	// 記事上：天使 / 過去世
	switch ( NIJI_BANNER_TOP_MODE ) {
		case 'tenshi':
			$top = $items['top'][0];
			break;
		case 'kakoze':
			$top = $items['top'][1];
			break;
		default:
			$top = $items['top'][ $post_id % 2 ];
	}

	return niji_banner_html( $top, 'top' ) . $content . niji_banner_html( $items['bottom'], 'bottom' );
}
// 目次プラグイン等より後に実行（優先度 20）
add_filter( 'the_content', 'niji_banner_insert', 20 );

/**
 * 見た目（スマホでもはみ出さない・角丸・押したとき少し浮く）
 */
function niji_banner_style() {
	if ( ! is_singular( 'post' ) ) {
		return;
	}
	echo '<style id="niji-banner-css">
.niji-banner{margin:0 0 2em;text-align:center;line-height:0}
.niji-banner--bottom{margin:2.5em 0 1em}
.niji-banner a{display:block;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(120,100,180,.18);transition:transform .2s,box-shadow .2s}
.niji-banner a:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(120,100,180,.28)}
.niji-banner img{display:block;width:100%;height:auto;max-width:100%;margin:0;border:0}
</style>';
}
add_action( 'wp_head', 'niji_banner_style' );
