<?php
if(!defined('ABSPATH')) exit;
function mglsa_session(){nocache_headers();header('Cache-Control: private, no-store, max-age=0',true);header('Vary: Cookie',false);wp_send_json_success(['allowed'=>is_user_logged_in()]);}
add_action('wp_ajax_mglsa_session','mglsa_session');
add_action('wp_ajax_nopriv_mglsa_session','mglsa_session');
add_action('after_setup_theme',static function(){add_theme_support('title-tag');});
add_action('template_redirect',static function(){
 if(is_admin()||wp_doing_ajax()||(defined('REST_REQUEST')&&REST_REQUEST)||is_feed()||is_preview())return;
 $path=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH);
 $base=rtrim((string)parse_url(home_url('/'),PHP_URL_PATH),'/');
 if(!is_string($path)||($base!==''&&$path!==$base&&!str_starts_with($path,$base.'/')))return;
 $rel=trim(substr($path,strlen($base)),'/');
 if(!preg_match('~^(?:[a-z0-9-]+(?:/[a-z0-9-]+)?)?$~D',$rel))return;
 $theme='theme-1';$slug=$rel?:'home';
 if($rel==='theme-1'||$rel==='theme-2'){$theme=$rel;$slug='home';}
 elseif(str_starts_with($rel,'theme-2/')||str_starts_with($rel,'theme-1/')){[$theme,$slug]=explode('/',$rel,2);}
 if($slug==='home'&&isset($_GET['page'])&&is_string($_GET['page'])&&preg_match('~^[a-z0-9-]+$~D',$_GET['page']))$slug=$_GET['page'];
 $root=get_template_directory().'/website';
 $data=json_decode((string)@file_get_contents($root.'/site-content.json'),true);
 if(!is_array($data)||empty($data['pages']))return;
 $known=array_column($data['pages'],'slug');
 if(!in_array($slug,$known,true))return;
 $asset=trailingslashit(get_template_directory_uri()).'website/'.$theme.'/';
 $cfg=['theme'=>$theme,'slug'=>$slug,'assetBase'=>$asset,'home'=>home_url('/'),'session'=>add_query_arg('action','mglsa_session',admin_url('admin-ajax.php'))];
 status_header(200);nocache_headers();header('Content-Type: text/html; charset=UTF-8');
 echo '<!doctype html><html lang="en" data-layout="'.esc_attr($theme).'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Meta Grey Label</title><script>window.__mglStandalone='.wp_json_encode($cfg,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';</script><script defer src="'.esc_url($asset.'script.js?mglsa=21').'"></script></head><body><main id="mgl-loading" role="status">Loading Meta Grey Label…</main><noscript>JavaScript is required to load this website.</noscript></body></html>';exit;
},0);
