<?php
function pin_local_screen(){
 if(!current_user_can('manage_options'))return;
 $state=get_option(pin_local_option(),[]);$pages=pin_local_pages();$total=count($pages);$cursor=(int)($state['cursor']??0);
 ?>
 <div class="wrap mgl-release-setup"><div class="mgl-setup-hero"><div><span class="mgl-setup-kicker">Meta Grey Label / Site setup</span><h1>Launch your brokerage website</h1><p>Install the complete Forexy dark design from local files. Customize your pages and global design in WordPress without a separate importer.</p></div><span class="mgl-setup-version">FSE · v0.0.1</span></div>
 <?php if(!empty($state['error'])):?><div class="notice notice-error"><p><?php echo esc_html($state['error']);?></p></div><?php endif;?>
 <div class="mgl-setup-grid"><section class="mgl-setup-card"><h2>Forexy — Dark</h2>
 <?php if(is_file(get_theme_file_path('/screenshot.png'))):?><img class="mgl-setup-preview" src="<?php echo esc_url(get_theme_file_uri('/screenshot.png'));?>" alt="Meta Grey Label homepage"><?php endif;?>
 <div class="mgl-setup-stats"><div><b><?php echo (int)$total;?></b><span>Website pages</span></div><div><b>FSE</b><span>Native editor</span></div><div><b>Local</b><span>Offline import</span></div></div><p>Original forest-green and lime branding. Includes native blog templates, responsive navigation and editable source blocks.</p></section>
 <section class="mgl-setup-card"><h2><?php echo !empty($state['done'])?'Website ready':'Import and launch';?></h2><p>Import in small, resumable batches. Existing unrelated pages and existing owned edits are not overwritten by default.</p><progress id="mgl-setup-progress" max="<?php echo max(1,$total);?>" value="<?php echo (int)$cursor;?>"></progress><p id="pin-local-progress" aria-live="polite"><?php echo (int)$cursor;?> / <?php echo (int)$total;?> pages imported or matched.</p>
 <?php if(!empty($state['done'])):?><div class="mgl-setup-links"><a class="button button-primary" href="<?php echo esc_url(home_url('/'));?>">View website</a><a class="button" href="<?php echo esc_url(admin_url('site-editor.php'));?>">Edit site</a><a class="button" href="<?php echo esc_url(admin_url('post-new.php'));?>">Publish a post</a></div>
 <?php else:?><form id="pin-local-import" method="post" action="<?php echo esc_url(admin_url('admin-post.php'));?>"><input type="hidden" name="action" value="pin_local_import"><?php wp_nonce_field('pin_local_import');?>
 <?php if(!empty(pin_structured_config()['source_layout']['legacyPage'])):?><label><input type="checkbox" name="replace_legacy" value="1"> Replace previously imported legacy pages. Back up your site first. WordPress revisions are retained where enabled.</label><?php endif;?>
 <button class="button button-primary"><?php echo $cursor?'Resume import':'Import &amp; Launch Website';?></button></form><?php endif;?>
 <div class="mgl-setup-note"><h2>Next steps</h2><p>Review imported content, publish a blog post, and configure enquiry delivery. Back up your database and files before upgrading an existing website.</p><div class="mgl-setup-links"><a class="button" href="<?php echo esc_url(admin_url('admin.php?page=mgl-enquiry-settings'));?>">Enquiry settings</a><a class="button" href="<?php echo esc_url(admin_url('edit.php?post_type=page'));?>">Manage pages</a></div></div>
 </section></div></div>
 <?php
}
