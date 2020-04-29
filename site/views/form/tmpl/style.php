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
<style type="text/css">
<?php
foreach ($cid as $id => $value) {
    $str = self::setDesignCssVariables($value->design);
?>
.ba-form-<?php echo $id; ?>,
.forms-calendar-wrapper[data-form="<?php echo $id; ?>"],
.ba-form-authorize-modal[data-form="<?php echo $id; ?>"] {
    <?php echo $str; ?>
}
<?php
}
?>
</style>
<script type="text/javascript">
var JUri = '<?php echo JUri::root(); ?>',
	uploads_storage = '<?php echo UPLOADS_STORAGE; ?>',
	loadFormsMap = <?php echo $loadMapJSON; ?>;
window.conditionLogic = window.conditionLogic ? window.conditionLogic : {};
<?php
foreach ($cid as $id => $value) {
    $conditionLogic = json_encode($value->conditionLogic->conditions);
?>
window.conditionLogic[<?php echo $id; ?>] = <?php echo $conditionLogic; ?>;
<?php
}
?>
</script>
<?php
foreach ($cid as $id => $value) {
    if (!empty($value->design->css)) {
?>
<style type="text/css">
<?php echo $value->design->css; ?>
</style>
<?php
    }
    if (!empty($value->design->js)) {
?>
<script type="text/javascript">
<?php echo $value->design->js; ?>
</script>
<?php
    }
}
$out = ob_get_contents();
ob_end_clean();