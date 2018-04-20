Ext.define('Ext.ux.VSQL.SQLTableModel', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'id',
        type: 'string'
    }, {
        name: 'tableName',
        type: 'string'
    }, {
        name: 'tableAlias',
        type: 'string'
    }]
});

Ext.define('Ext.ux.VSQL.SQLFieldsModel', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'id',
        type: 'string'
    }, {
        name: 'tableName',
        type: 'string'
    }, {
        name: 'tableId',
        type: 'string'
    }, {
        name: 'extCmpId',
        type: 'string'
    }, {
        name: 'tableAlias',
        type: 'string'
    }, {
        name: 'field',
        type: 'string'
    }, {
        name: 'output',
        type: 'boolean'
    }, {
        name: 'expression',
        type: 'string'
    }, {
        name: 'aggregate',
        type: 'string'
    }, {
        name: 'alias',
        type: 'string'
    }, {
        name: 'sortType',
        type: 'string'
    }, {
        name: 'sortOrder',
        type: 'int'
    }, {
        name: 'grouping',
        type: 'boolean'
    }, {
        name: 'criteria',
        type: 'string'
    }]
});

Ext.define('Ext.ux.VSQL.SQLTableStore', {
    extend: 'Ext.data.Store',
    autoSync: true,
    model: 'Ext.ux.VSQL.SQLTableModel',
    proxy: {
        type: 'memory'
    }
});


Ext.define('Ext.ux.VSQL.SQLFieldsStore', {
    extend: 'Ext.data.Store',
    autoSync: true,
    model: 'Ext.ux.VSQL.SQLFieldsModel',
    proxy: {
        type: 'memory'
    }
});

Ext.define('Ext.ux.VSQL.SQLJoin', {
    extend: 'Ext.data.Model',
    fields: [{
        name: 'id',
        type: 'string'
    }, {
        name: 'leftTableId',
        type: 'string'
    }, {
        name: 'rightTableId',
        type: 'string'
    }, {
        name: 'leftTableField',
        type: 'string'
    }, {
        name: 'rightTableField',
        type: 'string'
    }, {
        name: 'joinCondition',
        type: 'string'
    }, {
        name: 'joinType',
        type: 'string'
    }],
    createUUID: function() {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    }
});

Ext.define('Ext.ux.VSQL.JoinStore', {
    extend: 'Ext.data.Store',
    autoSync: true,
    model: 'Ext.ux.VSQL.SQLJoin',
    proxy: {
        type: 'memory'
    }
});

Ext.define('Ext.ux.VSQL.SQLSelect', {
    config: {
        tables: '',
        fields: '',
        joins: ''
    },
    constructor: function() {

        this.tables = Ext.create('Ext.ux.VSQL.SQLTableStore', {
            storeId: 'SQLTableStore'
        });
        // handle all updates on sql tables
        //this.tables.on('update', this.handleSQLTableUpdate, this);
        //this.tables.on('add', this.handleSQLTableAdd, this);
        //this.tables.on('remove', this.handleSQLTableRemove, this);

        this.fields = Ext.create('Ext.ux.VSQL.SQLFieldsStore', {
            storeId: 'SQLFieldsStore'
        });

        //this.fields.on('update', this.handleSQLFieldChanges, this);
        //this.fields.on('remove', this.handleSQLFieldRemove, this);

        this.joins = Ext.create('Ext.ux.VSQL.JoinStore', {
            storeId: 'JoinStore'
        });

        // this.joins.on('update', this.handleSQLJoinChanges, this);
        //this.joins.on('add', this.handleSQLJoinChanges, this);
        //this.joins.on('remove', this.handleSQLJoinChanges, this);

        this.callParent(arguments);
    },
    handleSQLTableUpdate: function(tableStore, table, operation) {
        if (operation == 'commit') {
            this.updateFieldTableData(table);
            this.updateJoinTableData(table);
            this.updateSQLOutput();
        }
    },
    handleSQLTableAdd: function(tableStore, table, index) {
        this.updateSQLOutput();
    },
    handleSQLTableRemove: function(tableStore, table, index) {
        var aJoins = [];
        // get table joins and remove them
        aJoins = this.getJoinsByTableId(table.get('id'));
        // loop over the joins array
        for (var i = 0, l = aJoins.length; i < l; i++) {
            // remove join from store
            this.removeJoinById(aJoins[i].get('id'));
        }
        this.updateSQLOutput();
    },
    handleSQLJoinChanges: function(joinStore, join) {
        this.updateSQLOutput();
    },
    updateFieldTableData: function(table) {
        var tableId, expression, tableAlias, tableName;
        tableId = table.get('id');
        tableAlias = table.get('tableAlias');
        tableName = table.get('tableName');
        // loop over all fields of the fields store
        this.fields.each(function(field) {
            // check if current field belongs to sql table
            if (field.get('tableId') == tableId) {
                if (tableAlias != '') {
                    // we have a table alias
                    expression = tableAlias + '.' + field.get('field');
                } else {
                    // no table alias
                    expression = tableName + '.' + field.get('field');
                };
                field.beginEdit();
                // update the field table alias
                field.set('tableAlias', tableAlias);
                // update the field expression
                field.set('expression', expression);
                field.commit(true);
                field.endEdit();
            }
        });
        return;
    },
    updateJoinTableData: function(table) {
        var joins, tableId;
        tableId = table.get('id');
        joins = this.getJoinsByTableId(tableId);
        for (var i = 0, rightTable, leftTable, joinCondition = '', l = joins.length; i < l; i++) {
            leftTable = this.getTableById(joins[i].get('leftTableId'));
            rightTable = this.getTableById(joins[i].get('rightTableId'));

            if (leftTable.get('tableAlias') != '') {
                joinCondition = joinCondition + leftTable.get('tableAlias') + '.' + joins[i].get('leftTableField') + '=';
            } else {
                joinCondition = joinCondition + leftTable.get('tableName') + '.' + joins[i].get('leftTableField') + '=';
            }

            if (rightTable.get('tableAlias') != '') {
                joinCondition = joinCondition + rightTable.get('tableAlias') + '.' + joins[i].get('rightTableField');
            } else {
                joinCondition = joinCondition + rightTable.get('tableName') + '.' + joins[i].get('rightTableField');
            }
            joins[i].beginEdit();
            joins[i].set('joinCondition', joinCondition);
            joins[i].commit(true);
            joins[i].endEdit();
        }
    },
    handleSQLFieldChanges: function(fieldStore, model, operation) {

        if (operation == 'commit') {
            this.updateSQLOutput();
        }
    },
    handleSQLFieldRemove: function(fieldStore) {
        this.updateSQLOutput();
    },
    updateSQLOutput: function() {
        var sqlOutput, sqlHTML, sqlQutputPanel;
        sqlOutput = this.toString();
        sqlHTML = '<pre class="brush: sql">' + sqlOutput + '</pre>';
        sqlQutputPanel = Ext.getCmp('SQLOutputPanel');

        sqlQutputPanel.update(sqlHTML);
    },
    sortTablesByJoins: function(tables, oUsedTables) {
        var aTables = [],
            aJoins = [],
            oUsedTables = oUsedTables || {};
        // loop over tables
        for (var i = 0, aCondition = [], aJoin, l = tables.length; i < l; i++) {
            // check if current table is a new one
            if (!oUsedTables.hasOwnProperty(tables[i].get('id'))) {
                // it is a new one
                aTables.push(tables[i]);
                // mark table as used
                oUsedTables[tables[i].get('id')] = true;
                // get any joins for the current table
                aJoin = this.getJoinsByTableId(tables[i].get('id'));
                // loop over the join tables
                for (var j = 0, joinTable, len = aJoin.length; j < len; j++) {
                    // check if it is a new join
                    if (!oUsedTables.hasOwnProperty(aJoin[j].get('id'))) {
                        // mark join as used
                        oUsedTables[aJoin[j].get('id')] = true;
                        if (tables[i].get('id') != aJoin[j].get('leftTableId')) {
                            joinTable = this.getTableById(aJoin[j].get('leftTableId'));
                            this.changeLeftRightOnJoin(aJoin[j]);
                        } else {
                            joinTable = this.getTableById(aJoin[j].get('rightTableId'));
                        }
                        oTemp = this.sortTablesByJoins([joinTable], oUsedTables);
                        oUsedTables = oTemp.oUsedTables;
                        aTables = aTables.concat(oTemp.aTables);
                    }
                }
            }
        }

        return {
            aTables: aTables,
            oUsedTables: oUsedTables
        };
    },
    changeLeftRightOnJoin: function(join) {
        var leftTable, leftTableField, rightTable, rightTableField, joinCondition = '';
        // prepare new data
        leftTable = this.getTableById(join.get('rightTableId'));
        leftTableField = join.get('rightTableField');
        rightTable = this.getTableById(join.get('leftTableId'));
        rightTableField = join.get('leftTableField');

        // construct new joinCondition
        if (leftTable.get('tableAlias') != '') {
            joinCondition = joinCondition + leftTable.get('tableAlias') + '.' + join.get('rightTableField') + '=';
        } else {
            joinCondition = joinCondition + leftTable.get('tableName') + '.' + join.get('rightTableField') + '=';
        }

        if (rightTable.get('tableAlias') != '') {
            joinCondition = joinCondition + rightTable.get('tableAlias') + '.' + join.get('leftTableField');
        } else {
            joinCondition = joinCondition + rightTable.get('tableName') + '.' + join.get('leftTableField');
        }

        // start transaction
        join.beginEdit();
        // change left and right join table data
        join.set('leftTableId', leftTable.get('id'));
        join.set('leftTableField', leftTableField);
        join.set('rightTableId', rightTable.get('id'));
        join.set('rightTableField', rightTableField);
        join.set('joinCondition', joinCondition);
        // silent commit without firing store events
        // this prevents endless loop
        join.commit(true);
        join.endEdit();
        // end transaction
        return;
    },
    getTableById: function(tableID) {
        return this.tables.getById(tableID);
    },
    removeFieldById: function(id) {
        var field;
        field = this.fields.getById(id);
        this.fields.remove(field);
    },
    removeFieldsByTableId: function(tableId) {
        var aRecords = [];
        this.fields.each(function(model) {
            if (model.get('tableId') == tableId) {
                aRecords.push(model);
            }
        });
        this.fields.remove(aRecords);
    },
    addTable: function(table) {
        this.tables.add(table);
    },
    removeTableById: function(tableID) {
        var table;
        table = this.tables.getById(tableID);
        this.tables.remove(table);
    },
    addFieldRecord: function(record, bOutput) {
        var tableAlias, model, expression;
        // get the tableAlias
        tableAlias = this.getTableById(record.get('tableId')).get('tableAlias');
        // build the expression
        // check if the tableAlias is not an empty string
        if (tableAlias != '') {
            // alias is not an empty string
            expression = tableAlias + '.' + record.get('field');
        } else {
            // alias is an empty string
            expression = record.get('tableName') + '.' + record.get('field');
        };
        // get a new field instance
        model = this.getNewField();
        // set the expression
        model.set('expression', expression);
        // set output to false per default
        model.set('output', bOutput);
        // set an id, so it is possible to remove rows if the associated table is removed
        model.set('id', record.get('id'));
        // set the field
        model.set('field', record.get('field'));
        // copy tableId to the new model instance
        model.set('tableId', record.get('tableId'));
        // copy cmp id of origin sqltable to the new model instance
        model.set('extCmpId', record.get('extCmpId'));
        this.addField(model);
    },
    addField: function(field) {
        this.fields.add(field);
    },
    getNewField: function() {
        return Ext.create('Ext.ux.window.visualsqlquerybuilder.SQLFieldsModel');
    },
    removeJoinById: function(joinID) {
        var join;
        join = this.joins.getById(joinID);
        this.joins.remove(join);
    },
    addJoin: function(join) {
        this.joins.add(join);
    },
    arrayRemove: function(array, filterProperty, filterValue) {
        var aReturn;
        aReturn = Ext.Array.filter(array, function(item) {
            var bRemove = true;
            if (item[filterProperty] == filtervalue) {
                bRemove = false;
            }
            return bRemove;
        });
        return aReturn
    }
});

Ext.define('VDBDesigner', {

    extend: 'Ext.Panel',
    alias: 'widget.VDBDesigner',
    dbo: -1,
    initComponent: function() {
        var Me = this;
        this.dtables = [];
        this.vqbuilder = {
            connections: []
        };
        this.tbar = [{
                text: "New scheme",
                padding: 4,
                iconCls: "ico-newfile",
                handler: function() {
                    Lockr.set('scheme', Me.scheme);
                }
            }, {
                text: "Load scheme",
                iconCls: "ico-openfile",
                padding: 4,
                handler: function(me) {
                    var draw = me.up('panel').down('draw');
                    for (var i = 0; i < Me.dtables.length; i++) {
                        Me.dtables[i].close();
                    };
                    Me.dtables = [];

                    var scheme = Lockr.get('scheme');
                    Me.scheme = scheme;
                    var TBL = [];
                    for (var i = 0; i < scheme.tables.length; i++) {
                        var sqltb = Ext.create('VDesignTable', {
                            constrain: true,
                            oaid: "tb|0|" + scheme.db + '|' + scheme.tables[i],
                            oadb: scheme.db,
                            oatbl: scheme.tables[i],
                            title: scheme.db + '.' + scheme.tables[i],
                            vParent: Me,
                            X: scheme.table[scheme.tables[i]].x,
                            Y: scheme.table[scheme.tables[i]].y,
                            W: scheme.table[scheme.tables[i]].width,
                            H: scheme.table[scheme.tables[i]].height
                        });
                        Me.dtables.push(sqltb);
                        TBL.push(sqltb);
                        me.up('panel').down('draw').add(sqltb).show();
                    };
                    var draw = me.up('panel').down('draw');
                    for (var i = 0; i < scheme.links.length; i++) {
                        var lnk = scheme.links[i];
                        var aBBPos = lnk.index;

                        for (var j = 0; j < TBL.length; j++) {
                            if (TBL[j].oaid.toUpperCase() == lnk.t0.toUpperCase()) var sqlTable1 = TBL[j];
                            if (TBL[j].oaid.toUpperCase() == lnk.t1.toUpperCase()) var sqlTable2 = TBL[j];
                        };
                        sqlTable1.shadowSprite.bConnections = true;
                        sqlTable2.shadowSprite.bConnections = true;
                        var connection = sqlTable2.connection(sqlTable1.shadowSprite, sqlTable2.shadowSprite, "#000", aBBPos);

                        var draw = sqlTable1.up('draw');

                        sqlTable1.connectionUUIDs.push(connection.uuid);
                        sqlTable2.connectionUUIDs.push(connection.uuid);

                        sqlTable2.vParent.vqbuilder.connections.push(connection);
                    };
                }
            },
            {
                text: "Save scheme",
                iconCls: "ico-savefile",
                padding: 4,
                handler: function() {
                    Lockr.set('scheme', Me.scheme);
                }
            }
        ];
        this.vqbuilder.sqlSelect = Ext.create('Ext.ux.VSQL.SQLSelect');

        this.closable = true;
        this.layout = {
            type: 'border'
        };

        this.title = 'DB Designer: ' + this.dbo;

        this.scheme = {
            db: -1,
            tables: [],
            table: {},
            links: []
        };

        this.items = [{
            region: "center",
            xtype: "panel",
            border: false,
            //flex: 1,
            margin: 0,
            layout: {
                type: 'border'
            },
            split: true,
            items: [{
                xtype: 'draw',
                itemId: "D0",
                border: false,
                //bodyStyle: "background-color:red",
                region: 'center',
                layout: {
                    type: 'vbox',
                    align: 'stretch',
                    pack: 'start',
                },
                //width: 2500,
                scrollable: true,
                //flex: 1,
                split: true,
                viewBox: false,

                listeners: {
                    afterrender: function(p) {
                        this.initDropTarget();
                    }
                },
                initDropTarget: function() {

                    var me = this;

                    this.dropTarget = Ext.create('Ext.dd.DropTarget', this.el, {
                        ddGroup: 'sqlDDGroup',
                        notifyDrop: function(source, event, data) {

                            var sqlTablePanel;

                            // add a sqltable to the sqlTablePanel component

                            var tbl = data.records[0].data.id;
                            //Tbx|0|testDB|Agents
                            var db = tbl.split('|')[2];
                            tbl = tbl.split('|')[3];

                            if (Me.dbo != db) {
                                // reject if this is not the same db
                                return false;
                            };
                            var sqltb = Ext.create('VDesignTable', {
                                constrain: true,
                                oaid: data.records[0].data.id,
                                oadb: db,
                                oatbl: tbl,
                                title: db + '.' + tbl,
                                vParent: Me
                            });
                            Me.dtables.push(sqltb);
                            Me.scheme.db = db;
                            Me.scheme.tables.push(tbl);
                            Me.scheme.table[tbl] = {
                                x: 0,
                                y: 0
                            }

                            me.add(sqltb).show();
                        }
                    });
                }
            }]
        }];
        this.callParent(arguments);
    }
});