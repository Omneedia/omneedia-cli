App.view.define('{{name}}', {
    extend: "Ext.window.Window",
    alias: 'widget.{{cname@Alias}}',
    initComponent: function () {
        this.width = 1024;
        this.height = 660;
        this.title = "{{title@Titre}}";
        this.layout = {
            type: 'fit'
        };

        this.bbar = [
        ];

        this.defaults = {
        };

        this.items = [

        ];

        this.callParent();
    }
});