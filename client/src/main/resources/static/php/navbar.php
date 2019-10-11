<?php
class navbar{
    
    public static function navbar() {
        if(!isset($_SESSION)) {
            session_start();
        }
        $nav_return  =  '<nav id="navbar">'."\n";
       
        
       
        $nav_return .=  '</div>';
        $nav_return .=  '<ul>'."\n";
        $nav_return .=  '<li><a href="#">Helped</a></li>'."\n";
        $nav_return .=  '<li><a href="#">Heper</a></li>'."\n";
        
        
        
        $nav_return .=  '</ul>'."\n";
        $nav_return .=  '</nav>'."\n";
        return $nav_return;
    }
    
}
?>