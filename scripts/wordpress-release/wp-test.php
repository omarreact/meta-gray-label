<?php
wp_set_current_user(1);
function mgl_qa($ok,$message){if(!$ok)throw new Exception($message);}
mgl_qa(wp_get_theme()->get('Name')==='Meta Grey Label','Wrong name');
mgl_qa(wp_get_theme()->get('Version')==='0.0.1','Wrong version');
mgl_qa(count(pin_local_pages())===52,'Page inventory');
for($i=0;$i<20;$i++){
 $r=pin_local_import_batch(false);
 mgl_qa(!is_wp_error($r),is_wp_error($r)?$r->get_error_message():'Import error');
 if(!empty($r['done']))break;
}
mgl_qa(!empty($r['done'])&&count($r['ids'])===52,'Import incomplete');
mgl_qa(count(pin_local_import_batch(false)['ids'])===52,'Duplicate import');
foreach(['single','home','archive','category','tag','author','search','404','page-insights'] as $slug)mgl_qa((bool)get_block_template(wp_get_theme()->get_stylesheet().'//'.$slug,'wp_template'),'Missing '.$slug);
$id=wp_insert_post(['post_type'=>'post','post_status'=>'publish','post_title'=>'Production blog fixture','post_name'=>'production-blog-fixture','post_content'=>'<!-- wp:paragraph --><p>Native post body verification.</p><!-- /wp:paragraph -->'],true);
mgl_qa(!is_wp_error($id)&&$id>0,'Failed native post');
$term=wp_insert_term('Technology fixture','category',['slug'=>'technology-fixture']);
if(!is_wp_error($term))wp_set_post_categories($id,[$term['term_id']]);
mgl_qa((bool)get_post_meta($r['ids']['/contact/'],'_pin_import_seo_description',true),'SEO metadata missing');
mgl_qa(WP_Block_Type_Registry::get_instance()->is_registered('mgl/layout'),'Legacy layout compatibility missing');
$old='<!-- wp:mgl/layout {"tagName":"section","sourceClass":"legacy-test","sourceAttrs":{}} --><!-- wp:paragraph --><p>Legacy edit</p><!-- /wp:paragraph --><!-- /wp:mgl/layout -->';
mgl_qa(str_contains(do_blocks($old),'legacy-test'),'Legacy render failed');
echo "PASS: 52 pages, release identity, templates, native blog, SEO, legacy block and repeat import.\n";
