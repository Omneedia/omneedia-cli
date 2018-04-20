Ext.define('VDesigner', {

    extend: 'Ext.Panel',
    alias: 'widget.VDesigner',

    initComponent: function() {
        this.title = 'DB Designer: ' + this.dbo;
    }
});