<?php
defined('ABSPATH') || exit;
// Keep the prior installed directory and resolve earlier generated markers.
// Existing user-edited database templates remain intact; no automatic reset.
function mgl_release_legacy_urls($value){
 if(is_array($value))return array_map('mgl_release_legacy_urls',$value);
 if(!is_string($value))return $value;
 $value=str_replace(array('__MGL_ASSET__','/wp-content/themes/meta-grey-label-standalone/website/'),array(untrailingslashit(get_theme_file_uri('/source')),trailingslashit(get_theme_file_uri('/source'))),$value);
 return preg_replace_callback('/__MGL_ROUTE_theme-2_([a-z0-9-]+)__/',static function($m){$path=$m[1]==='home'?'':$m[1].'/';return home_url('/'.$path);},$value);
}
add_filter('render_block_data',static function($block){
 foreach(array('attrs','innerHTML','innerContent') as $key)if(isset($block[$key]))$block[$key]=mgl_release_legacy_urls($block[$key]);
 return $block;
},11);
foreach(array('page','post','wp_template','wp_template_part','wp_navigation','wp_block') as $type)add_filter('rest_prepare_'.$type,static function($response){if(!is_wp_error($response)&&isset($response->data['content']))$response->data['content']=mgl_release_legacy_urls($response->data['content']);return $response;},11);
add_action('init',static function(){
 if(WP_Block_Type_Registry::get_instance()->is_registered('mgl/layout'))return;
 wp_register_script('mgl-legacy-editor',get_theme_file_uri('/legacy-editor.js'),array('wp-blocks','wp-element','wp-block-editor','wp-components'),'0.0.1',true);
 $metadata=json_decode((string)file_get_contents(get_theme_file_path('/blocks/source-layout/block.json')),true);
 register_block_type('mgl/layout',array('api_version'=>3,'editor_script'=>'mgl-legacy-editor','attributes'=>array('tagName'=>array('type'=>'string','default'=>'div'),'sourceClass'=>array('type'=>'string','default'=>''),'sourceAttrs'=>array('type'=>'object','default'=>new stdClass())),'supports'=>$metadata['supports'],'render_callback'=>static function($attrs,$content){
   $attrs['sourceAttrs']['class']=trim(($attrs['sourceAttrs']['class']??'').' '.($attrs['sourceClass']??''));
   $tag=$attrs['tagName']??'div';
   if($tag==='figure')return pin_source_open_tag('figure',$attrs).$content.'</figure>';
   return pin_source_layout_render($attrs,$content);
 }));
 wp_add_inline_script('mgl-legacy-editor','window.mglLegacySupports='.wp_json_encode($metadata['supports']).';','before');
},20);
