Ext.define('VDesignTable', {

    extend: 'Ext.window.Window',
    alias: 'widget.VDesignTable',

    minWidth: 120,
    oaid: "",
    firstTime: true,

    cascadeOnFirstShow: 20,
    height: 180,
    width: 200,
    shadowSprite: {},
    layout: {
        type: 'fit'
    },
    closable: true,
    listeners: {
        show: function(me) {
            if ((this.X) && (this.Y)) this.setPosition(this.X, this.Y);
            if (this.W) this.setWidth(this.W);
            if (this.H) this.setHeight(this.H);
            if (this.firstTime) this.initSQLTable(me);
            this.firstTime = false;
        },
        beforeclose: function(me) {
            this.closeSQLTable(me);
        }
    },
    closeSQLTable: function(me) {

        for (var i = 0; i < this.vParent.scheme.tables.length; i++) {
            if (this.oatbl == this.vParent.scheme.tables[i]) this.vParent.scheme.tables.splice(i, 1);
        };
        var to_delete = [];
        for (var i = 0; i < this.vParent.scheme.links.length; i++) {
            if (this.vParent.scheme.links[i].t0 == this.oaid) to_delete.push(i);
            if (this.vParent.scheme.links[i].t1 == this.oaid) to_delete.push(i);
        };
        for (var i = 0; i < to_delete.length; i++) this.vParent.scheme.links.splice(i, 1);
        delete(this.vParent.scheme.table[this.oatbl]);
        // remove fields / columns from sqlFieldsStore

        var a = me.up('tabpanel').getActiveTab();

        a.vqbuilder.sqlSelect.removeFieldsByTableId(this.tableId);

        // remove table from sqlTables store inside ux.vqbuilder.sqlSelect
        a.vqbuilder.sqlSelect.removeTableById(this.tableId);

        var dtables = a.dtables;
        for (var i = 0; i < dtables.length; i++) {
            if (dtables[i].id == me.id) dtables.splice(i, 1);
        };



        // unregister mousedown event
        this.getHeader().el.un('mousedown', this.regStartDrag, this);
        // unregister mousemove event
        Ext.getDoc().un('mousemove', this.moveWindow, this);
        Ext.getDoc().un('mouseup', this.moveWindow, this);
        // remove sprite from surface
        a.down('draw').getSurface().remove(this.shadowSprite, false);
        // remove any connection lines from surface and from array ux.vqbuilder.connections
        a.vqbuilder.connections = Ext.Array.filter(a.vqbuilder.connections, function(connection) {
            var bRemove = true;
            for (var j = 0, l = this.connectionUUIDs.length; j < l; j++) {
                if (connection.uuid == this.connectionUUIDs[j]) {
                    connection.line.remove();
                    connection.bgLine.remove();
                    connection.miniLine1.remove();
                    connection.miniLine2.remove();
                    bRemove = false;
                }
            }
            return bRemove;
        }, this);
        a.down('draw').renderFrame();
    },
    getOffset: function(constrain) {
        var xy = this.dd.getXY(constrain),
            s = this.dd.startXY;
        // return the the difference between the current and the drag&drop start position
        return [xy[0] - s[0], xy[1] - s[1]];
    },
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
    },
    regStartDrag: function(p, event, domEl, opt) {
        // start the drag of the sprite
        this.shadowSprite.startDrag(this.getId());
    },
    moveWindow: function(p, event, domEl, opt) {

        var relPosMovement;


        if (!p.up('tabpanel')) {
            return;
        }
        var a = p.up('tabpanel').getActiveTab();
        if (!a.scheme) return false;

        // get relative x and y values (offset)
        try {
            relPosMovement = p.getOffset('point');
        } catch (el) {
            relPosMovement = [0, 0];
        }

        Ext.getCmp(p.id).vParent.scheme.table[Ext.getCmp(p.id).oatbl].x = p.getX() - p.up('draw').el.getX();
        Ext.getCmp(p.id).vParent.scheme.table[Ext.getCmp(p.id).oatbl].y = p.getY() - p.up('draw').el.getY();
        Ext.getCmp(p.id).vParent.scheme.table[Ext.getCmp(p.id).oatbl].width = p.getWidth();
        Ext.getCmp(p.id).vParent.scheme.table[Ext.getCmp(p.id).oatbl].height = p.getHeight();

        // move the sprite to the position of the window
        p.shadowSprite.onDrag(relPosMovement);

        // check if the sprite has any connections

        if (p.shadowSprite.bConnections) {
            // also move the associated connections
            for (var i = a.vqbuilder.connections.length; i--;) {
                this.connection(a.vqbuilder.connections[i]);
            }
        }

    },
    beforeShow: function(me) {
        var aWin, prev, o;
        if (this.cascadeOnFirstShow) {
            o = (typeof this.cascadeOnFirstShow == 'number') ? this.cascadeOnFirstShow : 20;
            this.cascadeOnFirstShow = false;
            // get all instances from xtype sqltable
            aWin = Ext.ComponentQuery.query('VDesignTable');
            // start position if there is only one table
            if (aWin.length == 1) {
                this.x = o;
                this.y = o;
            } else {
                // loop through all instances from xtype sqltable
                for (var i = 0, l = aWin.length; i < l; i++) {
                    if (aWin[i] == this) {
                        if (prev) {
                            this.x = prev.x + o;
                            this.y = prev.y + o;
                        }
                    }
                    if (aWin[i].isVisible()) {
                        prev = aWin[i];
                    }
                }
            };

            this.setPosition(this.x, this.y);
        }
    },
    initSQLTable: function(mee) {
        // get the main sqlTablePanel position

        xyParentPos = mee.up('draw').el.getXY();

        // get position of the previously added sqltable
        xyChildPos = this.el.getXY();

        // get the size of the previously added sqltable
        childSize = this.el.getSize();

        var sprite = Ext.create('Ext.draw.sprite.Rect', {
            stroke: '#fff',
            //stroke: 'green',
            height: childSize.height - 4,
            width: childSize.width - 4,
            x: xyChildPos[0] - xyParentPos[0] + 2,
            y: xyChildPos[1] - xyParentPos[1] + 2,
            startDrag: function(id) {

                var me = this,
                    win, sqlTablePanel, xyParentPos, xyChildPos;

                // get a reference to a sqltable
                win = Ext.getCmp(id);

                // get the main sqlTablePanel (mee)

                // get the main sqlTablePanel position
                xyParentPos = mee.up('draw').el.getXY();

                // get the size of the previously added sqltable
                xyChildPos = win.el.getXY();

                me.prev = [
                    xyChildPos[0] - xyParentPos[0] + 2,
                    xyChildPos[1] - xyParentPos[1] + 2
                ];

                mee.up('draw').getSurface().renderFrame();

            },
            onDrag: function(relPosMovement) {

                var xy, me = this,
                    attr = this.attr,
                    newX, newY;
                // move the sprite
                // calculate new x and y position
                if (!me.prev) {
                    me.prev = [me.x, me.y];
                    //return;
                };

                newX = me.prev[0] + relPosMovement[0];
                newY = me.prev[1] + relPosMovement[1];
                // set new x and y position and redraw sprite
                me.setAttributes({
                    x: newX,
                    y: newY
                }, true);
                mee.up('draw').renderFrame();
            }
        });
        this.shadowSprite = mee.up('draw').getSurface().add(sprite).show(true);
        mee.up('draw').renderFrame();

        // handle resizeing of sqltable
        mee.on('resize', function(resizer, width, height, event) {

            mee.shadowSprite.setAttributes({
                width: width - 6,
                height: height - 6
            }, true);

            // also move the associated connections 
            for (var i = mee.vParent.vqbuilder.connections.length; i--;) {
                mee.connection(mee.vParent.vqbuilder.connections[i]);
            }

        }, this);

        // register a function for the mousedown event on the previously added sqltable and bind to this scope
        this.getHeader().getEl().on('mousedown', this.regStartDrag, this);

        this.getHeader().getEl().on('move', function(event, domEl, opt) {
            mee.moveWindow(mee, event, domEl, opt);
        });

        //this.getHeader().el.on('contextmenu', this.showSQLTableCM, this);

        //this.getHeader().el.on('dblclick', this.showTableAliasEditForm, this);

        this.getHeader().origValue = '';

        // register a function for the mousedown event on the previously added sqltable and bind to this scope
        Ext.getDoc().on('mousemove', function(event, domEl, opt) {
            //console.log('c');
            mee.moveWindow(mee, event, domEl, opt);
        });
        mee.on('drag', function(event, domEl, opt) {
            //console.log('a');
            mee.moveWindow(mee, event, domEl, opt);
        });

        // register a function for the mouseup event on the document and add the this scope
        var tt = this;
        Ext.getDoc().on('mouseup', function(event, domEl, opt) {

            mee.moveWindow(mee, event, domEl, opt);
        });

    },
    getLeftRightCoordinates: function(obj1, obj2, aBBPos) {

        var bb1, bb2, p = [],
            dx, leftBoxConnectionPoint, rightBoxConnectionPoint, dis, columHeight = 21,
            headerHeight = 46,
            LeftRightCoordinates = {};

        // BoundingBox Koordinaten für beide Sprites abrufen

        bb1 = obj1.getBBox();

        // y Wert für connection Points auf der linken und rechten Seite von bb1
        //bb1.pY = bb1.y + headerHeight + ((aBBPos[0] - 1) * columHeight) + (columHeight / 2) - obj1.scrollTop;

        if (obj1.scrollTop) var sctop = obj1.scrollTop;
        else sctop = 0

        bb1.pY = bb1.y + headerHeight + ((aBBPos[0] - 1) * columHeight) + (columHeight / 2) - sctop;

        bb2 = obj2.getBBox();

        if (obj2.scrollTop) var sctop = obj2.scrollTop;
        else sctop = 0

        // y Wert für connection Points auf der linken und rechten Seite von bb2
        //bb2.pY = bb2.y + headerHeight + ((aBBPos[1] - 1) * columHeight) + (columHeight / 2) - obj2.scrollTop;
        bb2.pY = bb2.y + headerHeight + ((aBBPos[1] - 1) * columHeight) + (columHeight / 2) - sctop;

        // code für linke boundingBox
        if (bb1.pY > (bb1.y + 4) && bb1.pY < (bb1.y + bb1.height - 4)) {
            p.push({
                x: bb1.x - 1, // Punkt auf linker Seite auf Höhe der verknüpften Spalte
                y: bb1.pY
            });
            p.push({
                x: bb1.x + bb1.width + 1, // Punkt auf rechter Seite auf Höhe der verknüpften Spalte
                y: bb1.pY
            });
        } else {
            if (bb1.pY < (bb1.y + 4)) {
                p.push({
                    x: bb1.x - 1, // Punkt auf linker Seite max. obere Position
                    y: bb1.y + 4
                });
                p.push({
                    x: bb1.x + bb1.width + 1, // Punkt auf rechter Seite max. obere Position
                    y: bb1.y + 4
                });
            } else {
                p.push({
                    x: bb1.x - 1, // Punkt auf linker Seite max. untere Position
                    y: bb1.y + bb1.height - 4
                });
                p.push({
                    x: bb1.x + bb1.width + 1, // Punkt auf rechter Seite max. untere Position
                    y: bb1.y + bb1.height - 4
                });
            };
        };

        //  code für rechte boundingBox
        if (bb2.pY > (bb2.y + 4) && bb2.pY < (bb2.y + bb2.height - 4)) {
            p.push({
                x: bb2.x - 1, // Punkt auf linker Seite auf Höhe der verknüpften Spalte
                y: bb2.pY
            });
            p.push({
                x: bb2.x + bb2.width + 1, // Punkt auf rechter Seite auf Höhe der verknüpften Spalte
                y: bb2.pY
            });
        } else {
            if (bb2.pY < (bb2.y + 4)) {
                p.push({
                    x: bb2.x - 1, // Punkt auf linker Seite max. obere Position
                    y: bb2.y + 4
                });
                p.push({
                    x: bb2.x + bb2.width + 1, // Punkt auf rechter Seite max. obere Position
                    y: bb2.y + 4
                });
            } else {
                p.push({
                    x: bb2.x - 1, // Punkt auf linker Seite max. untere Position
                    y: bb2.y + bb2.height - 4
                });

                p.push({
                    x: bb2.x + bb2.width + 1, // Punkt auf rechter Seite max. untere Position
                    y: bb2.y + bb2.height - 4
                });
            }
        };

        // Schleife über die Punkte der ersten BoundingBox
        for (var i = 0; i < 2; i++) {
            // Schleife über die Punkte der zweiten BoundingBox
            for (var j = 2; j < 4; j++) {
                // Berechnung der Offsets zwischen den jeweils vier Punkten beider BoundingBoxes
                dx = Math.abs(p[i].x - p[j].x), dy = Math.abs(p[i].y - p[j].y);
                // bb1 links mit bb2 rechts
                if (((i == 0 && j == 3) && dx < Math.abs(p[1].x - p[2].x)) || ((i == 1 && j == 2) && dx < Math.abs(p[0].x - p[3].x))) {
                    leftBoxConnectionPoint = p[i];
                    rightBoxConnectionPoint = p[j];
                }
            }
        };

        return {
            leftBoxConnectionPoint: leftBoxConnectionPoint,
            rightBoxConnectionPoint: rightBoxConnectionPoint
        };

    },
    connection: function(obj1, obj2, line, aBBPos) {

        var Line = line;
        var LeftRightCoordinates, line1, line2, miniLine1, miniLine2, path, surface, color = typeof line == "string" ? line : "#000";

        if (obj1.line && obj1.from && obj1.to && obj1.aBBPos) {
            line = obj1;
            obj1 = line.from;
            obj2 = line.to;
            aBBPos = line.aBBPos;
        }

        // set reference to the wright surface
        surface = obj1.getSurface();

        // get coordinates for the left and right box

        LeftRightCoordinates = this.getLeftRightCoordinates(obj1, obj2, aBBPos);

        // check if the LeftBox is still on the left side or not
        if (LeftRightCoordinates.leftBoxConnectionPoint.x - LeftRightCoordinates.rightBoxConnectionPoint.x < 0) {
            line1 = 12;
            line2 = 12;
        } else {
            line1 = -12;
            line2 = -12;
        }
        // define the path between the left and the right box
        path = ["M", LeftRightCoordinates.leftBoxConnectionPoint.x, LeftRightCoordinates.leftBoxConnectionPoint.y, "H", LeftRightCoordinates.leftBoxConnectionPoint.x + line1, "L", LeftRightCoordinates.rightBoxConnectionPoint.x - line2, LeftRightCoordinates.rightBoxConnectionPoint.y, "H", LeftRightCoordinates.rightBoxConnectionPoint.x].join(",");

        miniLine1 = ["M", LeftRightCoordinates.leftBoxConnectionPoint.x, LeftRightCoordinates.leftBoxConnectionPoint.y, "H", LeftRightCoordinates.leftBoxConnectionPoint.x + line1].join(",");

        miniLine2 = ["M", LeftRightCoordinates.rightBoxConnectionPoint.x - line2, LeftRightCoordinates.rightBoxConnectionPoint.y, "H", LeftRightCoordinates.rightBoxConnectionPoint.x].join(",");

        //check if it is a new connection or not

        if (line && line.line) {
            // old connection, only change path

            line.bgLine &&
                line.bgLine.setAttributes({
                    path: path
                });

            line.line.setAttributes({
                path: path
            });

            line.miniLine1.setAttributes({
                path: miniLine1
            });

            line.miniLine2.setAttributes({
                path: miniLine2
            });

            surface.renderFrame();

        } else {
            // new connction, return new connection object
            var ooo = {};
            var line = {
                lineType: "line",
                type: 'path',
                path: path,
                stroke: "black",
                fill: 'none',
                'stroke-width': 1,
                listeners: {
                    click: function() {
                        //alert('x');
                    }
                }
            };
            var miniLine1 = {
                lineType: "miniLine1",
                type: 'path',
                path: miniLine1,
                stroke: "#000000",
                fill: 'none',
                'stroke-width': 2
            };
            var miniLine2 = {
                lineType: "miniLine2",
                type: 'path',
                path: miniLine2,
                stroke: "#000000",
                fill: 'none',
                'stroke-width': 2
            };
            var bgLine = {
                lineType: "bgLine",
                type: 'path',
                path: path,
                opacity: 0,
                //stroke: '#fff',
                stroke: "red",
                fill: 'none',
                'stroke-width': 10,
                listeners: {
                    click: function() {
                        //alert('x');
                    }
                }
            };
            surface.add(line);
            ooo.uuid = this.createUUID();

            Ext.util.Observable.capture(line, function(evname) {

            })
            ooo.line = surface._items[surface._items.length - 1];
            surface.add(miniLine1);
            ooo.miniLine1 = surface._items[surface._items.length - 1];
            surface.add(miniLine2);
            ooo.miniLine2 = surface._items[surface._items.length - 1];
            surface.add(bgLine);
            ooo.bgLine = surface._items[surface._items.length - 1];
            ooo.from = obj1;
            ooo.to = obj2;
            ooo.aBBPos = aBBPos;

            surface.renderFrame();
            return ooo;
        }
    },
    initComponent: function() {
        var store, tableModel;

        this.connectionUUIDs = [];

        this.tableId = this.createUUID();

        if (this.local) {
            store = Ext.create('Ext.data.Store', {
                autoLoad: true,
                fields: [{
                    name: 'id',
                    type: 'string'
                }, {
                    name: 'tableName',
                    type: 'string'
                }, {
                    name: 'tableId',
                    type: 'string',
                    defaultValue: this.tableId
                }, {
                    name: 'field',
                    type: 'string'
                }, {
                    name: 'extCmpId',
                    type: 'string',
                    defaultValue: this.id
                }, {
                    name: 'type',
                    type: 'string'
                }, {
                    name: 'null',
                    type: 'string'
                }, {
                    name: 'key',
                    type: 'string'
                }, {
                    name: 'default',
                    type: 'string'
                }, {
                    name: 'extra',
                    type: 'string'
                }],
                data: []
            });
        } else {

            store = Ext.create('Ext.data.Store', {
                autoLoad: true,
                fields: [{
                    name: 'id',
                    type: 'string'
                }, {
                    name: 'tableName',
                    type: 'string'
                }, {
                    name: 'tableId',
                    type: 'string',
                    defaultValue: this.tableId
                }, {
                    name: 'field',
                    type: 'string'
                }, {
                    name: 'extCmpId',
                    type: 'string',
                    defaultValue: this.id
                }, {
                    name: 'type',
                    type: 'string'
                }, {
                    name: 'null',
                    type: 'string'
                }, {
                    name: 'key',
                    type: 'string'
                }, {
                    name: 'default',
                    type: 'string'
                }, {
                    name: 'extra',
                    type: 'string'
                }],
                proxy: {
                    type: 'ajax',
                    actionMethods: {
                        read: 'POST'
                    },
                    url: '/db/tableinfo',
                    extraParams: {
                        tablename: this.oaid
                    },
                    reader: {
                        type: 'json'
                    }
                }

            });
        }

        tableModel = Ext.create('Ext.ux.VSQL.SQLTableModel', {
            id: this.tableId,
            tableName: this.title,
            tableAlias: ''
        });

        this.vParent.vqbuilder.sqlSelect.addTable(tableModel);

        var moo = this;

        this.items = [{
            xtype: 'grid',
            itemId: "TbGrid",
            border: false,
            hideHeaders: true,
            viewConfig: {
                listeners: {
                    scroll: function() {
                        var scrollOffset, sqlTable;
                        // the bodyscroll event of the view was fired
                        // get scroll information
                        scrollOffset = this.getEl().getScroll();

                        // get the parent sqltable
                        sqlTable = this.up('VDesignTable');

                        // change shadowSprites scrollTop property

                        sqlTable.shadowSprite.scrollTop = scrollOffset.top;

                        // redraw all connections to reflect scroll action
                        for (var i = moo.vParent.vqbuilder.connections.length; i--;) {
                            sqlTable.connection(moo.vParent.vqbuilder.connections[i]);
                        };
                    },
                    render: function(view) {
                        this.dd = {};

                        // init the view as a DragZone
                        this.dd.dragZone = new Ext.view.DragZone({
                            view: view,
                            ddGroup: 'SQLTableGridDDGroup',
                            dragText: '{0} selected table column{1}',
                            onInitDrag: function(x, y) {
                                var me = this,
                                    data = me.dragData,
                                    view = data.view,
                                    selectionModel = view.getSelectionModel(),
                                    record = view.getRecord(data.item),
                                    e = data.event;
                                data.records = [record];
                                //me.ddel.update(me.getDragText());
                                //me.proxy.update(me.ddel.dom);
                                me.onStartDrag(x, y);
                                return true;
                            }
                        });
                        // init the view as a DropZone
                        this.dd.dropZone = new Ext.grid.ViewDropZone({
                            view: view,
                            ddGroup: 'SQLTableGridDDGroup',
                            handleNodeDrop: function(data, record, position) {
                                // Was soll nach dem Drop passieren?

                            },
                            onNodeOver: function(node, dragZone, e, data) {

                                var me = this,
                                    view = me.view,
                                    pos = me.getPosition(e, node),
                                    overRecord = view.getRecord(node),
                                    draggingRecords = data.records;

                                if (!Ext.Array.contains(data.records, me.view.getRecord(node))) {


                                    if (!Ext.Array.contains(draggingRecords, overRecord) && data.records[0].get('field') != '*') {

                                        me.valid = true;
                                        // valid drop target
                                        // todo show drop invitation
                                    } else {
                                        // invalid drop target
                                        me.valid = false;
                                    }
                                }
                                return me.valid ? me.dropAllowed : me.dropNotAllowed;
                            },
                            onContainerOver: function(dd, e, data) {
                                var me = this;
                                // invalid drop target
                                me.valid = false;
                                return me.dropNotAllowed;
                            }
                        });
                    },
                    drop: function(node, data, dropRec, dropPosition) {

                        var LNK = {};

                        var sqlTable1, sqlTable2, showJoinCM, connection, aBBPos, join, joinCondition = '',
                            dropTable, targetTable;

                        var componentID = data.item.outerHTML.split('<table id="')[1].split("-record")[0];

                        sqlTable1 = Ext.getCmp(componentID).up('window');
                        var componentID = node.outerHTML.split('<table id="')[1].split("-record")[0];

                        sqlTable2 = Ext.getCmp(componentID).up('window');
                        sqlTable1.shadowSprite.bConnections = true;
                        sqlTable2.shadowSprite.bConnections = true;

                        dropTable = moo.vParent.vqbuilder.sqlSelect.getTableById(sqlTable1.tableId);
                        targetTable = moo.vParent.vqbuilder.sqlSelect.getTableById(sqlTable2.tableId);

                        aBBPos = [data.item.dataset.recordindex, node.outerHTML.split('data-recordindex="')[1].split('"')[0]];

                        connection = sqlTable2.connection(sqlTable1.shadowSprite, sqlTable2.shadowSprite, "#000", aBBPos);

                        var draw = sqlTable1.up('draw');
                        LNK.t0 = sqlTable1.oaid;
                        LNK.t1 = sqlTable2.oaid;

                        sqlTable1.connectionUUIDs.push(connection.uuid);
                        sqlTable2.connectionUUIDs.push(connection.uuid);

                        LNK.uuid = connection.uuid;
                        LNK.index = connection.aBBPos;
                        moo.vParent.scheme.links.push(LNK);

                        moo.vParent.vqbuilder.connections.push(connection);

                    }
                }
            },
            columns: [{
                    xtype: 'gridcolumn',
                    width: 16,
                    dataIndex: 'key',
                    renderer: function(val, meta, model) {
                        if (val == 'PRI') {
                            meta.style = 'background-image:url(resources/images/key.png) !important;background-position:2px 3px;background-size:contain;background-repeat:no-repeat;';
                        }
                        return '&nbsp;';
                    }
                },
                {
                    xtype: 'gridcolumn',
                    flex: 1,
                    dataIndex: 'field',
                    renderer: function(val, meta, model) {
                        if (model.get('key') == 'PRI') {
                            return '<span style="font-weight: bold;">' + val + '</span>&nbsp;&nbsp;<span style="color:#aaa;">' + model.get('type') + '</span>';
                        }
                        return val + '&nbsp;&nbsp;<span style="color:#999;">' + model.get('type') + '</span>';
                    }
                }
            ],
            store: store
        }];

        this.callParent(arguments);
    }
});