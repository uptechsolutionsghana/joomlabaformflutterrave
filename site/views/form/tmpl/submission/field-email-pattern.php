<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

ob_start();
?>
<div style="max-width: 100%;  width: 550px; margin: 0 auto;">
	<span style="color:#333;font-weight: bold;line-height:28px;font-size:16px;white-space: normal;display:block;"><?php echo $field->title; ?>:</span>
<span style="color: #999;text-align: left;line-height: 28px;font-size: 16px;word-break: break-word;margin-bottom: 30px;display:block;"><?php echo $value; ?></span>
</div>
<?php
$out = ob_get_contents();
ob_end_clean();