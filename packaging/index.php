<?php if(!defined('ABSPATH'))exit; get_header(); if(have_posts()){while(have_posts()){the_post();the_content();}}else{echo '<main><h1>Page not found</h1></main>';} get_footer();
