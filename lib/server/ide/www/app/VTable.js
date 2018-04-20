Ext.define('VTable', {

    extend: 'Ext.Panel',
    alias: 'widget.VTable',

    initComponent: function() {
        this.layout = "border";
        this.closable = true;
        this.items = [{
                region: "north",
                height: 200,
                split: true,
                layout: "fit",
                items: [{
                    xtype: "grid",
                    itemId: "fields",
                    border: false,
                    update: function(response,view) {
                        
                        var r = JSON.parse(response.responseText);
                        
                        if (!r.fields) {
                            view.setDisabled(false);
                            return false;
                        };
                        var d = r.fields;
                        var _data = [];
                        var tabs = [];
                        var title = r.db + "." + r.tb;

                        for (var i = 0; i < d.length; i++) {
                            var obj = {
                                key: d[i].COLUMN_KEY,
                                field_name: d[i].COLUMN_NAME,
                                field_type: d[i].DATA_TYPE.toUpperCase(),
                                field_length: d[i].CHARACTER_MAXIMUM_LENGTH,
                                comment: d[i].COLUMN_COMMENT,
                                position: d[i].ORDINAL_POSITION,
                                table: d[i].TABLE_NAME,
                                db: d[i].TABLE_SCHEMA
                            };
                            if (d[i].IS_NULLABLE == "NO") obj.nullable = false;
                            else obj.nullable = true;
                            _data.push(obj);
                            var ed = {};
                            var rdr = "";
                            var obj = {
                                header: d[i].COLUMN_NAME,
                                dataIndex: d[i].COLUMN_NAME,
                                width: 200
                            };
                            if (d[i].DATA_TYPE.toUpperCase().indexOf('CHAR') > -1) {
                                obj.editor = {
                                    xtype: "textfield"
                                }
                            };
                            if (d[i].DATA_TYPE.toUpperCase().indexOf('DATE') > -1) {
                                obj.convert = function(v, j) {
                                    return new Date(v.replace(/\/Date((\d+))\//, '$1'));
                                };
                                obj.editor = {
                                    xtype: "datefield"
                                };
                                obj.renderer = Ext.util.Format.dateRenderer('d/m/Y H:i:s');
                            };

                            tabs.push(obj);
                            delete ed;
                        };

                        view.getStore().loadData(_data);
                        view.setDisabled(false);

                    },
                    listeners: {
                        edit: function(editor,e) {
                            var me = this;
                            e.view.setDisabled(true);
                            if (e.record.modified.field_name) {
                                // change field name
                                Ext.Ajax.request({
                                    url: '/db/fields/name',
                                    method: 'POST',
                                    params: {
                                        db: e.record.data.db,
                                        tb: e.record.data.table,
                                        from: e.record.modified.field_name,
                                        after: e.record.data.field_name,
                                        position: e.record.data.position
                                    },
                                    success: function(response) {
                                        me.update(response,e.view);
                                    }
                                })                                
                            };
                            if ((e.record.modified.comment) || (e.record.modified.comment=="")) {
                                // change field name
                                Ext.Ajax.request({
                                    url: '/db/fields/comment',
                                    method: 'POST',
                                    params: {
                                        db: e.record.data.db,
                                        tb: e.record.data.table,
                                        field: e.record.data.field_name,
                                        comment: e.record.data.comment,
                                        position: e.record.data.position
                                    },
                                    success: function(response) {
                                        me.update(response,e.view);
                                    }
                                })                                
                            };
                        },
                        beforedrop: function(node, data, overModel, dropPosition, dropHandlers, eOpts) {
                            data.view.setDisabled(true);
                            var me = this;
                            var records = data.view.getStore().data.items;
                            var record = data.records[0];

                            var p = data.view.up('panel');

                            var FROM = record.data.position;
                            var TO = overModel.data.position;

                            Ext.Ajax.request({
                                url: '/db/fields/position',
                                method: 'POST',
                                params: {
                                    db: record.data.db,
                                    tb: record.data.table,
                                    from: FROM,
                                    after: TO
                                },
                                success: function(response) {
                                    me.update(response,data.view);
                                }
                            })
                        }
                    },
                    plugins: [Ext.create('Ext.grid.plugin.CellEditing', {
                        clicksToMoveEditor: 1,
                        autoCancel: false
                    })],
                    viewConfig: {
                        plugins: {
                            ptype: 'gridviewdragdrop',
                            containerScroll: true,
                            dragGroup: 'FIELDS',
                            dropGroup: 'FIELDS'
                        }
                    },
                    tbar: [{
                        text: "<b>Add field</b>",
                        iconCls: "ico-add"
                    }],
                    columns: [{
                            header: "Name",
                            dataIndex: "field_name",
                            width: 200,
                            editor: {
                                xtype: "textfield"
                            },
                            renderer: function(data, p, s) {
                                var px = "<div class=fld>&nbsp;</div>";
                                var pxx = "";
                                if (s.data.key != "") {
                                    if (s.data.key == "PRI") px = "<b><div class=key>&nbsp;</div>";
                                    if (s.data.key == "MUL") px = "<b><div class=key_green>&nbsp;</div>";
                                    if (s.data.key == "UNI") px = "<b><div class=key_red>&nbsp;</div>";
                                    pxx = "</b>";
                                };
                                return px + data + pxx;
                            }
                        }, {
                            header: "Type",
                            align: "center",
                            dataIndex: "field_type",
                            width: 180,
                            editor: {
                                xtype: "combo",
                                displayField: "fld",
                                valueField: "fld",
                                store: Ext.create('Ext.data.Store', {
                                    fields: ["fld"],
                                    data: [
                                        { fld: "CHAR" },
                                        { fld: "VARCHAR" },
                                        { fld: "TINYTEXT" },
                                        { fld: "TEXT" },
                                        { fld: "MEDIUMTEXT" },
                                        { fld: "LONGTEXT" },
                                        { fld: "BINARY" },
                                        { fld: "VARBINARY" },
                                        { fld: "BIT" },
                                        { fld: "TINYINT" },
                                        { fld: "SMALLINT" },
                                        { fld: "MEDIUMINT" },
                                        { fld: "INT" },
                                        { fld: "INTEGER" },
                                        { fld: "BIGINT" },
                                        { fld: "DECIMAL" },
                                        { fld: "DEC" },
                                        { fld: "NUMERIC" },
                                        { fld: "FIXED" },
                                        { fld: "FLOAT" },
                                        { fld: "DOUBLE" },
                                        { fld: "REAL" },
                                        { fld: "FLOAT" },
                                        { fld: "DATE" },
                                        { fld: "DATETIME" },
                                        { fld: "TIMESTAMP" },
                                        { fld: "TIME" },
                                        { fld: "YEAR" },
                                        { fld: "TINYBLOB" },
                                        { fld: "BLOB" },
                                        { fld: "MEDIUMBLOB" },
                                        { fld: "LONGTEXT" }
                                    ]
                                })
                            }
                        },
                        {
                            header: "Size",
                            align: "center",
                            dataIndex: "field_length",
                            width: 80,
                            editor: {
                                xtype: "textfield"
                            }
                        },
                        {
                            header: "NULL",
                            align: "center",
                            width: 60,
                            dataIndex: "nullable",
                            xtype: "checkcolumn",
                            listeners: {
                                checkchange: function(me,cx,ischecked) {
                                    me.up('grid').getView().setDisabled(true);
                                    var d = me.up('grid').getStore().data.items[cx];
                                    Ext.Ajax.request({
                                        url: '/db/fields/nullable',
                                        method: 'POST',
                                        params: {
                                            db: d.data.db,
                                            tb: d.data.table,
                                            field: d.data.field_name,
                                            nullable: ischecked,
                                            position: d.data.position
                                        },
                                        success: function(response) {
                                            me.up('grid').update(response,me.up('grid').getView());
                                        }
                                    });
                                }
                            },
                            renderer: function(value, metaData, record) {
                                if (record.data.key == "") return this.defaultRenderer(value, metaData);
                            }
                        },
                        {
                            header: "Default",
                            align: "center",
                            width: 150,
                            dataIndex: "default"
                        },
                        {
                            header: "Comments",
                            dataIndex: "comment",
                            flex: 1,
                            editor: {
                                xtype: "textfield"
                            }
                        }
                    ],
                    store: Ext.create('Ext.data.Store', { fields: [], data: [] })
                }]
            },
            {
                region: "center",
                split: true,
                layout: "fit",
                tbar: [{
                    text: "<b>Add record</b>",
                    iconCls: "ico-add"
                }],
                items: [{
                    xtype: "grid",
                    border: false,
                    itemId: "fields",
                    itemId: "data",
                    bufferedRenderer: true,
                    plugins: [Ext.create('Ext.grid.plugin.RowEditing', {
                        clicksToMoveEditor: 1,
                        autoCancel: false
                    })],
                    columns: [

                    ],
                    //store: Ext.create('Ext.data.Store', { fields: [], data: [] })
                    store: Ext.create('Ext.data.BufferedStore', {
                        proxy: {
                            type: 'ajax',
                            url: '/db/data',
                            reader: {
                                type: 'json',
                                rootProperty: 'data',
                                totalProperty: 'total'
                            }
                        }
                    })
                }]
            }
        ];
        this.callParent();
    }
});