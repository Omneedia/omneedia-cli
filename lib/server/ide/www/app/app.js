var Panel = {};
Ext.onReady(function() {
    function createUUID() {
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
    };
    Ext.ariaWarn = Ext.emptyFn;

    Ext.application({
        name: 'OmneediaDB',
        launch: function() {
            Panel = Ext.create('Ext.panel.Panel', {
                title: '<b>Omneedia DB</b>',
                fullscreen: true,
                renderTo: Ext.getBody(),
                height: "100%",
                layout: "border",
                tbar: [],
                items: [{
                        region: "west",
                        split: true,
                        width: 300,
                        layout: "fit",
                        items: [{
                            xtype: "treepanel",
                            itemId: "treedb",
                            listeners: {
                                itemcontextmenu: function(view, r, node, index, e) {
                                    e.stopEvent();
                                    //console.log(r.data.id);
                                    var typ = r.data.id.split('|');
                                    //console.log(view.getStore().getNodeById('Business-0'));
                                    if (typ[0] == "Business-0") {
                                        Ext.create('Ext.menu.Menu', {
                                            items: [Ext.create('Ext.Action', {
                                                iconCls: 'ico-db',
                                                text: 'Add database',
                                                handler: function(me, store) {
                                                    vex.dialog.prompt({
                                                        message: 'Add a new database',
                                                        placeholder: 'Database name',
                                                        callback: function(value) {
                                                            if (!value) return;
                                                            Ext.Ajax.request({
                                                                url: '/db/add',
                                                                method: 'POST',
                                                                params: {
                                                                    id: r.data.id,
                                                                    db: value
                                                                },
                                                                success: function(response) {
                                                                    response = JSON.parse(response.responseText);
                                                                    view.getStore().load({
                                                                        node: r
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })]
                                        }).showAt(e.getXY());
                                    };
                                    if (typ[0] == "Business-1") {
                                        Ext.create('Ext.menu.Menu', {
                                            items: [Ext.create('Ext.Action', {
                                                iconCls: 'ico-db',
                                                text: 'Add database',
                                                handler: function(me, store) {
                                                    vex.dialog.prompt({
                                                        message: 'Add a new database',
                                                        placeholder: 'Database name',
                                                        callback: function(value) {
                                                            if (!value) return;
                                                            Ext.Ajax.request({
                                                                url: '/db/add',
                                                                method: 'POST',
                                                                params: {
                                                                    id: r.data.id,
                                                                    db: value
                                                                },
                                                                success: function(response) {
                                                                    response = JSON.parse(response.responseText);
                                                                    view.getStore().load({
                                                                        node: r
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })]
                                        }).showAt(e.getXY());
                                    };
                                    if ((typ[0] == "Tbx") || (typ[0] == "Tb")) {
                                        Ext.create('Ext.menu.Menu', {
                                            items: [Ext.create('Ext.Action', {
                                                    iconCls: 'ico-rename',
                                                    text: 'Rename table',
                                                    handler: function(me, store) {
                                                        vex.dialog.prompt({
                                                            message: 'Rename table',
                                                            placeholder: 'Table name',
                                                            callback: function(value) {
                                                                if (!value) return;

                                                                Ext.Ajax.request({
                                                                    url: '/db/rename/table',
                                                                    method: 'POST',
                                                                    params: {
                                                                        id: r.data.id,
                                                                        tb: value
                                                                    },
                                                                    success: function(response) {
                                                                        response = JSON.parse(response.responseText);
                                                                        view.getStore().load({
                                                                            node: r.parentNode
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        });
                                                    }
                                                }),
                                                Ext.create('Ext.Action', {
                                                    iconCls: 'ico-deletetb',
                                                    text: 'Remove table',
                                                    handler: function(me, store) {
                                                        vex.dialog.confirm({
                                                            message: 'Are you absolutely sure you want to delete `' + r.data.id.split('|')[3] + '`?',
                                                            callback: function(value) {
                                                                if (value) {
                                                                    Ext.Ajax.request({
                                                                        url: '/db/rm/table',
                                                                        method: 'POST',
                                                                        params: {
                                                                            id: r.data.id
                                                                        },
                                                                        success: function(response) {
                                                                            response = JSON.parse(response.responseText);
                                                                            view.getStore().load({
                                                                                node: r.parentNode
                                                                            });
                                                                        }
                                                                    })
                                                                }
                                                            }
                                                        })
                                                    }
                                                })
                                            ]
                                        }).showAt(e.getXY());
                                    }
                                    if (typ[0] == "XDB") {
                                        Ext.create('Ext.menu.Menu', {
                                            items: [Ext.create('Ext.Action', {
                                                    iconCls: 'ico-rename',
                                                    text: 'Rename',
                                                    handler: function(me) {
                                                        vex.dialog.prompt({
                                                            message: 'Rename',
                                                            placeholder: 'Name',
                                                            callback: function(value) {
                                                                if (!value) return;
                                                                Ext.Ajax.request({
                                                                    url: '/db/link/rename',
                                                                    method: 'POST',
                                                                    params: {
                                                                        id: r.data.id,
                                                                        db: value
                                                                    },
                                                                    success: function(response) {
                                                                        response = JSON.parse(response.responseText);
                                                                        view.getStore().load({
                                                                            node: r
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                }), Ext.create('Ext.Action', {
                                                    iconCls: 'ico-addtable',
                                                    text: 'Add table',
                                                    handler: function(me) {
                                                        vex.dialog.prompt({
                                                            message: 'Add a new table',
                                                            placeholder: 'Table name',
                                                            callback: function(value) {
                                                                if (!value) return;
                                                                Ext.Ajax.request({
                                                                    url: '/db/new/table',
                                                                    method: 'POST',
                                                                    params: {
                                                                        id: r.data.id,
                                                                        tb: value
                                                                    },
                                                                    success: function(response) {
                                                                        response = JSON.parse(response.responseText);
                                                                        view.getStore().load({
                                                                            node: r
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                }), Ext.create('Ext.Action', {
                                                    iconCls: 'ico-unlink',
                                                    text: 'Unlink',
                                                    handler: function(me, store) {
                                                        //console.log(r);
                                                        vex.dialog.confirm({
                                                            message: 'Are you absolutely sure you want to unlink `' + r.data.id.split('|')[2] + '`?',
                                                            callback: function(value) {
                                                                if (value) {
                                                                    Ext.Ajax.request({
                                                                        url: '/db/unlink',
                                                                        method: 'POST',
                                                                        params: {
                                                                            id: r.data.id
                                                                        },
                                                                        success: function(response) {
                                                                            response = JSON.parse(response.responseText);
                                                                            view.getStore().load({
                                                                                node: r.parentNode
                                                                            });
                                                                        }
                                                                    })
                                                                }
                                                            }
                                                        });
                                                    }
                                                }), Ext.create('Ext.Action', {
                                                    iconCls: 'ico-import',
                                                    text: 'Import',
                                                    handler: function() {
                                                        var inp = document.createElement('input');
                                                        inp.type = 'file';
                                                        inp.hidden = false;
                                                        document.getElementsByTagName('body')[0].appendChild(inp);
                                                        inp.click();
                                                        inp.addEventListener('change', function(x) {

                                                            if (x.target.files.length <= 0) return;

                                                            var file = x.target.files[0];
                                                            var formData = new FormData();
                                                            formData.append("avatar", file);
                                                            formData.append(id, r.data.id);
                                                            var n = PNotify.notice({
                                                                title: 'Import',
                                                                text: 'Please wait while importing file.',
                                                                hide: false
                                                            });
                                                            var xhr = new XMLHttpRequest();
                                                            var url = "/db/import";
                                                            xhr.open('POST', url, true);
                                                            xhr.onload = function(e) {
                                                                view.getStore().load({
                                                                    node: r
                                                                });
                                                                n.remove();
                                                            };
                                                            xhr.send(formData);
                                                        })
                                                    }
                                                })
                                                /*, Ext.create('Ext.Action', {
                                                                                                iconCls: 'ico-export',
                                                                                                text: 'Export',
                                                                                                menu: [{
                                                                                                    text: "to DBScheme",
                                                                                                    iconCls: "ico-db-create",
                                                                                                    handler: function(me, store) {

                                                                                                        var x = new XMLHttpRequest();
                                                                                                        x.open("GET", "/db/export/scheme?id=" + r.data.id, true);
                                                                                                        x.responseType = 'blob';
                                                                                                        x.onload = function(e) {
                                                                                                            //download(x.response, "dlBinAjax.gif", "image/gif"); 
                                                                                                        }
                                                                                                        x.send();

                                                                                                    }
                                                                                                }, {
                                                                                                    text: "From cloud",
                                                                                                    iconCls: "ico-db-cloud",
                                                                                                    handler: function(me, store) {

                                                                                                    }
                                                                                                }]

                                                                                            })*/
                                            ]
                                        }).showAt(e.getXY());
                                    };
                                    if (typ[0] == "Db") {
                                        Ext.create('Ext.menu.Menu', {
                                            items: [Ext.create('Ext.Action', {
                                                iconCls: 'ico-rename',
                                                text: 'Rename database',
                                                handler: function(me) {
                                                    vex.dialog.prompt({
                                                        message: 'Rename database',
                                                        placeholder: 'Db name',
                                                        callback: function(value) {
                                                            if (!value) return;
                                                            Ext.Ajax.request({
                                                                url: '/db/rename',
                                                                method: 'POST',
                                                                params: {
                                                                    id: r.data.id,
                                                                    db: value
                                                                },
                                                                success: function(response) {
                                                                    response = JSON.parse(response.responseText);
                                                                    view.getStore().load({
                                                                        node: r
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            }), Ext.create('Ext.Action', {
                                                iconCls: 'ico-link',
                                                text: 'Link',
                                                handler: function(me, store) {
                                                    Ext.Ajax.request({
                                                        url: '/db/link',
                                                        method: 'POST',
                                                        params: {
                                                            id: r.data.id
                                                        },
                                                        success: function(response) {
                                                            response = JSON.parse(response.responseText);
                                                            view.getStore().load({
                                                                node: view.getStore().getNodeById('Business-0')
                                                            }).on('load', function() {
                                                                view.getStore().getNodeById('Business-0').expand();
                                                            });
                                                        }
                                                    })
                                                }
                                            }), Ext.create('Ext.Action', {
                                                iconCls: 'ico-addtable',
                                                text: 'Add table',
                                                handler: function(me, store) {
                                                    vex.dialog.prompt({
                                                        message: 'Add a new table',
                                                        placeholder: 'Table name',
                                                        callback: function(value) {
                                                            if (!value) return;
                                                            Ext.Ajax.request({
                                                                url: '/db/new/table',
                                                                method: 'POST',
                                                                params: {
                                                                    id: r.data.id,
                                                                    tb: value
                                                                },
                                                                success: function(response) {
                                                                    response = JSON.parse(response.responseText);
                                                                    view.getStore().load({
                                                                        node: r
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            }), Ext.create('Ext.Action', {
                                                iconCls: 'ico-import',
                                                text: 'Import',
                                                handler: function() {
                                                    var inp = document.createElement('input');
                                                    inp.type = 'file';
                                                    inp.hidden = false;
                                                    document.getElementsByTagName('body')[0].appendChild(inp);
                                                    inp.click();
                                                    inp.addEventListener('change', function(x) {

                                                        if (x.target.files.length <= 0) return;

                                                        var file = x.target.files[0];
                                                        var formData = new FormData();
                                                        formData.append("avatar", file);
                                                        formData.append(id, r.data.id);
                                                        var xhr = new XMLHttpRequest();
                                                        var url = "/db/import";
                                                        xhr.open('POST', url, true);
                                                        xhr.onload = function(e) {
                                                            view.getStore().load({
                                                                node: r.parentNode
                                                            });
                                                        };
                                                        xhr.send(formData);
                                                    })
                                                }
                                            }), Ext.create('Ext.Action', {
                                                iconCls: 'ico-undb',
                                                text: 'Remove database',
                                                handler: function(me, store) {
                                                    var tp = Ext.getCmp('tabpanel').items.items;
                                                    vex.dialog.confirm({
                                                        message: 'Are you absolutely sure you want to delete `' + r.data.id.split('|')[1] + '`?',
                                                        callback: function(value) {
                                                            if (value) {
                                                                Ext.Ajax.request({
                                                                    url: '/db/rm',
                                                                    method: 'POST',
                                                                    params: {
                                                                        id: r.data.id
                                                                    },
                                                                    success: function(response) {
                                                                        response = JSON.parse(response.responseText);
                                                                        if (response.ERROR == "LINKED") {
                                                                            return PNotify.error({
                                                                                title: 'ERROR!',
                                                                                text: 'You must unlink database from your project before deleting it.'
                                                                            });
                                                                        };
                                                                        view.getStore().load({
                                                                            node: r.parentNode
                                                                        }).on('load', function() {
                                                                            var i = 0;
                                                                            while (i < tp.length) {
                                                                                if (tp[i].title.indexOf(r.data.id.split('|')[1]) > -1) {
                                                                                    Ext.getCmp('tabpanel').remove(Ext.getCmp('tabpanel').items.getAt(i));
                                                                                    tp = Ext.getCmp('tabpanel').items.items;
                                                                                    i = 0;
                                                                                } else i++;
                                                                            };
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    });
                                                }
                                            })]
                                        }).showAt(e.getXY());
                                    };
                                    return false;
                                },
                                itemdblclick: function(me, store) {
                                    var sm = me.getSelectionModel();
                                    var sel = sm.getSelection();
                                    var typ = sel[0].data.id.split('|')[0];
                                    if (typ == "ROOTNS") return;
                                    if (typ == "ROOTCOMPUTER") return;
                                    if (typ.indexOf("Business") > -1) return;
                                    if ((typ == "Db") || (typ.indexOf('XDB') > -1)) {
                                        if (typ.indexOf('XDB') > -1) {
                                            var p = Ext.create('VDBDesigner', {
                                                id: 'query-' + createUUID(),
                                                dbo: sel[0].data.id.split('|')[2]
                                            });
                                        } else {
                                            var p = Ext.create('VDBDesigner', {
                                                id: 'query-' + createUUID(),
                                                dbo: sel[0].data.id.split('|')[1]
                                            });
                                        }

                                        Ext.getCmp('tabpanel').add(p);
                                        Ext.getCmp('tabpanel').setActiveTab(p);
                                        return;
                                    };

                                    var p = Ext.create('VTable');
                                    p.setTitle('<b>' + sel[0].data.id.split('|')[2] + '</b> / ' + sel[0].data.id.split('|')[3]);
                                    Ext.getCmp('tabpanel').add(p);
                                    Ext.getCmp('tabpanel').setActiveTab(p);
                                    Ext.Ajax.request({
                                        url: '/db/getfields',
                                        method: 'POST',
                                        params: {
                                            id: store.data.id
                                        },
                                        success: function(response) {
                                            var r = JSON.parse(response.responseText);

                                            var d = r.fields;
                                            var data = [];
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
                                                data.push(obj);
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
                                            p.down('grid#fields').getStore().loadData(data);
                                            p.down("grid#data").reconfigure(p.down("grid#data").getStore(), tabs);
                                            p.down("grid#data").getStore().getProxy().extraParams.id = store.data.id;
                                            p.down("grid#data").getStore().load();
                                        }
                                    });
                                }
                            },
                            viewConfig: {
                                plugins: {
                                    ptype: 'treeviewdragdrop',
                                    dragGroup: 'sqlDDGroup',
                                    dropGroup: 'sqlDDGroup',
                                    appendOnly: true
                                }
                            },
                            margin: 2,
                            ddGroup: 'sqlDDGroup',
                            enableDragDrop: true,
                            border: false,
                            useArrows: true,
                            rootVisible: false,
                            store: Ext.create('Ext.data.TreeStore', {
                                root: {
                                    text: "IDE",
                                    iconCls: 'ico-sqlserver',
                                    children: [{
                                        text: Settings.NAMESPACE,
                                        id: "ROOTNS",
                                        iconCls: "ico-package"
                                    },{
                                        text: "My Computer",
                                        id: "ROOTCOMPUTER",
                                        iconCls: "ico-mycomputer"
                                    }]
                                },
                                proxy: {
                                    type: 'ajax',
                                    url: '/db/getnodes'
                                },
                                autoLoad: false
                            })
                        }]
                    },
                    {
                        region: "center",
                        split: true,
                        layout: "fit",
                        items: [{
                            xtype: "tabpanel",
                            id: "tabpanel",
                            items: [

                            ]
                        }]
                    }
                ]
            });
        }
    });

    window.onresize = function() {
        Panel.setWidth(Ext.getBody().getViewSize().width);
        Panel.setHeight(Ext.getBody().getViewSize().height);
    }

})