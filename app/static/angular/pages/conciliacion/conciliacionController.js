appModule.controller('conciliacionController', function($scope, $rootScope, $location, conciliacionFactory,  commonFactory, staticFactory, filterFilter ) {
    $scope.idUsuario            = parseInt( localStorage.getItem( "idUsuario" ) )
    $scope.session  = JSON.parse( sessionStorage.getItem( "sessionFactory" ) );
    $scope.lstPermisoBoton      = JSON.parse(sessionStorage.getItem("PermisoUsuario"));
    $scope.currentFinancialName = "Seleccionar Financiera";
    $scope.lbl_btn_descheck     = "Desmarcar Unidades";
    $scope.currentPanel         = 'pnlCargaArchivo';

    $scope.titleDocumentos        = '';
    $scope.titleDocumentosDetalle = '';
    $scope.tipoConciliacion=0;
    $scope.MuestranuevaConciliacion=false;
    $scope.MuestracompraVirtual=false;
    $scope.MuestragenerarConciliacion=false;
    $scope.Muestracancelar=false;
    /* =========================== 
        [ estSolAutorizacion ]
    Valida la aplicación de la conci
    liacion mediante autorización de
    usuarios mediante notificaciones

    0 => No aplica; 
    1 => Puede Solicitar;
    2 => Solicitó y esta en espera;
    3 => Aprobada;
    4 => Rechazada;
    ============================== */
    $scope.estSolAutorizacion   = 0;

    $scope.currentMonth         = 0;
    $scope.currentYear          = 0;
    
    $scope.flagAjusteCaseTree   = true;
    $scope.ajusteManual         = false;
    
    $scope.lstMonth             = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    $scope.cierreMes            = [];
    $scope.lstConceal           = [];
    $scope.lstFinancial         = [];
    $scope.lstPendiente         = [];
    $scope.lstConciliacion      = [];
    $scope.autDetalle           = [];
    $scope.lstConciliaDetalle   = [];
    
    $scope.currentFinancial     = {};
    $scope.currentConciliacion  = {};
    $scope.total                = { sistema: 0, archivo: 0 };
    $scope.frmConciliacion      = { lblMes: 0, idFinanciera: 0, loadLayout:false}
    $scope.situacion            = { ok:0, financiera:0, gpoAndrade: 0 };
    $scope.diferencias          = { iguales:0, diferentes: 0 };
    $scope.currentPeriodo={};
    $scope.currentPeriodo.periodo=null;

   

    var increment   = 0;
    var contador    = 0;
    $scope.init=function()
    {
        var valor=_.where($scope.lstPermisoBoton, { idModulo: 9,Boton: "nuevaConciliacion" })[0];
        $scope.MuestranuevaConciliacion=valor != undefined;
         valor=_.where($scope.lstPermisoBoton, { idModulo: 9,Boton: "compraVirtual" })[0];
        $scope.MuestracompraVirtual=valor != undefined;
         valor=_.where($scope.lstPermisoBoton, { idModulo: 9,Boton: "generarConciliacion" })[0];
        $scope.MuestragenerarConciliacion=valor != undefined;
         valor=_.where($scope.lstPermisoBoton, { idModulo: 9,Boton: "cancelar" })[0];
        $scope.Muestracancelar=valor != undefined;
    }
    $scope.init();
    $scope.obtienePeriodosActivos= function(){
        var parametros = {
            idEmpresa:      $scope.session.empresaID
          
        }
        conciliacionFactory.obtienePeriodosActivos(parametros).then(function(result) {
            if( result.data.length != 0 ){
                $scope.lstPeriodos = result.data;
                $scope.setPeriodo($scope.lstPeriodos[0]);
            }
        });
    }   
    $scope.setPeriodo = function(item) {
        // $scope.listUnidades = _.where($scope.lstNewUnits, { isChecked: true });
        $scope.currentPeriodo =item;
        $scope.currentNombrePeriodo =item.NombrePeriodo;
        $scope.obtieneCociliacion();
      
    };
    // Este es como funciona desde Branch Conciliación
    commonFactory.getFinancial( $scope.session.empresaID ).then(function(result) {
        $scope.lstFinancial = result.data;
    });
    $scope.SelectFinanciera= function(item){
        var parametros = {
            idEmpresa:      $scope.session.empresaID,
            idFinanciera:   $scope.frmConciliacion.idFinanciera
        }
        conciliacionFactory.getMesConciliacion(parametros).then(function(result) {
            $scope.lstMonths = result.data;
            $scope.currentMonth = $scope.lstMonths[0].nummes-1;
            $scope.currentYear  = $scope.lstMonths[0].anio;
            $scope.frmConciliacion.lblMes = $scope.lstMonth[ $scope.currentMonth ];  
            $scope.tiposConciliacion();
        }, function(error) {
            console.log("Error", error);
        });
        
    }
    $scope.tiposConciliacion = function() {

        conciliacionFactory.getTiposConciliacion().then(function(result) {
            $scope.lstTipoConciliacion = result.data;
        }, function(error) {
            console.log("Error", error);
        });
    };
    var myDropzone;
    $scope.Dropzone = function() {
        $("#templeteDropzone").html( '' )

        var html = `<form action="/file-upload" class="dropzone" id="idDropzone">
                        <div class="fallback">
                            <input name="file" type="file" accept="text/csv, .csv" />
                        </div>
                    </form>`;

        $("#templeteDropzone").html( html );
        myDropzone = new Dropzone("#idDropzone", {
            url: "api/apiConciliacion/upload",
            uploadMultiple: 0,
            maxFiles: 1,
            autoProcessQueue: false,
            acceptedFiles: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            webkitRelativePath:"/uploads"
        });

        myDropzone.on("success", function(req, xhr) {
            var _this = this;

            var filename = xhr + '.xlsx';
            $scope.loadingPanel = true;
            $('#mdlLoading').modal('show');
            $scope.readLayout(filename);

            $scope.limpiarDropzone = function(){
                _this.removeAllFiles();
                myDropzone.enable()
                $scope.frmConciliacion.loadLayout = true;
            }
        });

        myDropzone.on("addedfile", function() {
            $scope.frmConciliacion.loadLayout = true;
        });
    };

    $scope.validaExistencia = function(){
        console.log( "currentMonth", $scope.currentMonth );
        return new Promise((resolve, reject)=> {
            let parametros = {
                idEmpresa: $scope.session.empresaID,
                idFinanciera: $scope.frmConciliacion.idFinanciera,
                periodo: $scope.currentMonth + 1,
                anio: $scope.currentYear,
                idTipo:$scope.frmConciliacion.lbltipoconciliacion
            }
            conciliacionFactory.validaExistencia(parametros).then(function(result) {
                resolve(result.data[0]);
            })
        })
    }

    var execelFields = [];
    $scope.readLayout = function(filename) {
        conciliacionFactory.readLayout(filename).then(function(result) {
            var LayoutFile = result.data;
            var aux = [];
            for (var i = 1; i < LayoutFile.length; i++) {
                aux.push(LayoutFile[i]);
            }

            execelFields = $scope.arrayToObject(aux);
            $scope.insertData();
        }, function(error) {
            console.log("Error", error);
        });
    };

    $scope.insertData = function() {
        try{
            execelFields[increment]['consecutivo'] = contador;
            conciliacionFactory.insExcelData(execelFields[increment]).then(function(result) {
                if( !result.data ){
                    swal("Conciliación","El archivo que porporciona no contiene el formato que se espera, asegurese de cargar el layout esperado.");
                    $('#mdlLoading').modal('hide');
                    $scope.loadingPanel = false;
                }
                else{
                    if( result.data[0].success == 1 ){
                        contador    = parseInt(result.data[0].consecutivo);

                        if (increment >= (execelFields.length - 1)) {
                            // $scope.nexStep();
                            $scope.frmConciliacion.loadLayout = true;
                            $scope.loadingPanel = false;
                            $('#mdlLoading').modal('hide');
                                if($scope.frmConciliacion.lbltipoconciliacion== 1)
                                    $scope.currentPanel = 'pnlConciliar';
                                else
                                    $scope.currentPanel = 'pnlConciliarUnidades';
                            $scope.conceal();
                            $("#modalNuevaConciliacion").modal('hide');
                            var aux = filterFilter($scope.lstFinancial, { financieraID: $scope.frmConciliacion.idFinanciera });
                            $scope.lblFinanciera = aux[0].nombre;
                        }
                        else{
                            increment++;
                            $scope.insertData();
                        }
                    }                    
                }
            })
            .catch(function(e){
               console.log("got an error in initial processing",e);
               throw e;
            }).then(function(res){
            });            
        }
        catch( e ){
            console.log( "Error", e );
            swal("Conciliación","El archivo que porporciona no contiene el formato que se espera, asegurese de cargar el layout esperado.");
        }
    }

    $scope.arrayToObject = function(array) {
        var lst = [];
        for (var i = 0; i < array.length; i++) {
            var obj = { dato1: array[i].Numeroserie, dato2: array[i].Valor, dato3: array[i].Interes };
            lst.push(obj);
        }
        return lst;
    };

    $scope.conceal = function() {
      
        conciliacionFactory.getConciliacion( ($scope.currentMonth + 1), contador, $scope.frmConciliacion.idFinanciera ).then(function(result) {
            $scope.lstConceal = result.data;
            $scope.creaConciliacion(2,contador);
            $scope.sumTotal();
        });

        $scope.getCierreMes();
    };

    $scope.muestraConciliacionPendiente = function( idconciliacion ){
        $scope.idconciliacion=idconciliacion.idConciliacion;
        $scope.estatusConciliacion=idconciliacion.estatus;
        $scope.frmConciliacion.lbltipoconciliacion=idconciliacion.idTipo;
                                    

        conciliacionFactory.getConciliacionGuardada($scope.idconciliacion).then(function(result) {
            $scope.lstConceal = result.data;
            $scope.sumTotal();

             if($scope.frmConciliacion.lbltipoconciliacion== 1)
                                    $scope.currentPanel = 'pnlConciliar';
                                else
                                    $scope.currentPanel = 'pnlConciliarUnidades';

            conciliacionFactory.autorizacionDetalle( $scope.idconciliacion  ).then(function(detalle) {
                if( detalle.data.length != 0 ){
                   

                    $scope.autDetalle = detalle.data[0];

                    $scope.frmConciliacion.lblMes       = $scope.lstMonth[ ($scope.autDetalle.periodoContable - 1) ];
                    $scope.frmConciliacion.idFinanciera = $scope.autDetalle.idFinanciera;
                    $scope.lblFinanciera                = $scope.autDetalle.nombre;
                    switch( $scope.autDetalle.estatus ){
                        case 0: $scope.estSolAutorizacion = 4; break;
                        case 1: $scope.estSolAutorizacion = 2; break;
                        case 2: $scope.estSolAutorizacion = 3; break;
                    }                    
                    console.log( "estSolAutorizacion", $scope.estSolAutorizacion );

                }
            })
        });
    }

    $scope.muestraDetalleDocumentos = function( item ){
        $scope.currentConciliacion = item;
        $scope.titleDocumentos = item.Descipcion;
        $scope.idConciliacion = item.idConciliacion;
        conciliacionFactory.conciliaDetalle( item.idConciliacion ).then(function(result) {
            if( result.data.length != 0 ){
                $scope.lstConciliaDetalle = result.data;
                $scope.currentPanel = 'pnlDocumentos';
            }
        });
    }

    $scope.validaCancelacion = function(){
        conciliacionFactory.validaCancelacion($scope.idConciliacion).then(function(resultValida) {
            var validacion = resultValida.data[0][0];
            if( validacion.PROCESADOS == 0 ){
                $scope.CancelaConciliacion();
            }
            else if( validacion.PAGADOS == 0 ){
                $scope.CancelaConciliacion();
            }
            else if( validacion.PAGADOS == 1 ){
                swal("Conciliación Plan Piso","No se puede cancelar la conciliación ya existen documentos pagados, cancele los pagos para poder continuar con esta acción.");
            }
        });
    }

    $scope.CancelaConciliacion = function(){
        swal({
            title: "Conciliación Plan Piso",
            text: "¿Desea cancelar la conciliación?",
            showCancelButton: true,
            closeOnConfirm: false,
            showLoaderOnConfirm: true
        }, function () {
            conciliacionFactory.CancelaConciliacion($scope.idConciliacion).then(function(resultValida) {
                swal("Conciliación Plan Piso","Se ha efectuado correctamnete la cancelación de la conciliación");
                location.reload();
                // $scope.regresaConciliacionPanel();
                // $scope.obtieneCociliacion();
            });
        });
    }

    $scope.getCierreMes = function() {
        conciliacionFactory.getCierreMes( ($scope.currentMonth + 1) ).then(function(result) {
            $scope.cierreMes = result.data;
        });
    };
    
    $scope.sumTotal = function(val) {
        // consecutivo = 0;
        $scope.total.archivo = 0;
        $scope.total.sistema = 0;

        $scope.lstConceal.forEach(function(item) {
            $scope.total.sistema += item.InteresMesActual;
            $scope.total.archivo += item.interes;

            switch( parseInt(item.equiparante) ){
                case 1:
                    $scope.situacion.ok = $scope.situacion.ok + 1;
                     if($scope.estatusConciliacion == 1){
                        $scope.situacion.financiera = $scope.situacion.financiera + 1;
                        }
                    break;
                case 2:
                    $scope.situacion.financiera = $scope.situacion.financiera + 1;
                    break;
                case 3:
                    $scope.situacion.gpoAndrade = $scope.situacion.gpoAndrade + 1;
                    break;
            }

            if( parseInt(item.esMayor) == 1 ){
                $scope.diferencias.iguales = $scope.diferencias.iguales + 1;
            }
            else{
                $scope.diferencias.diferentes = $scope.diferencias.diferentes + 1;
            }
        });

        $scope.controlCheck();
        $scope.readyConciliation();

        // Valida estatus de autorización
        // if($scope.situacion.gpoAndrade != 0 && $scope.situacion.financiera == 0){
        //     $scope.estSolAutorizacion  = 1;
        //     //$scope.conciliacion = false;
        // }
    };

    $scope.controlCheck = function() {
        $scope.lstConceal.forEach(function(item, key) {
            $scope.lstConceal[key]['checked'] = true;
            $scope.lstConceal[key]['ajuste']  = item.InteresMesActual;
        });
        $scope.lbl_btn_descheck = "Desmarcar Unidades";
        $scope.flagAjusteCaseTree   = true;
    };

    $scope.controlCheckDeseleccionar = function() {
        if( $scope.lbl_btn_descheck == "Desmarcar Unidades" ){
            $scope.lstConceal.forEach(function(item, key) {
                if( item.equiparante == 3 ){
                    $scope.lstConceal[key]['checked'] = false;
                }
            });            

            $scope.total.sistema = 0;
            $scope.lstConceal.forEach(function(item) {
                if( item.equiparante == 1 ){
                    $scope.total.sistema += item.InteresMesActual;
                }
            });

            $scope.lbl_btn_descheck     = "Marcar Unidades";
            $scope.flagAjusteCaseTree   = false;
        }
        else{
            $scope.controlCheck();
            $scope.total.sistema = 0;
            $scope.lstConceal.forEach(function(item) {
                $scope.total.sistema += item.InteresMesActual;
            });
            $scope.ajusteManual         = false;
        }
        $scope.readyConciliation();
    };

    $scope.setCurrentFinancial = function(financialObj) {
        $scope.currentFinancial = financialObj;
        $scope.currentFinancialName = financialObj.nombre;
    };

    $scope.nexStep = function() {
        if($scope.frmConciliacion.lblMes == ''){
            swal("Conciliación","No se ha especificado el periodo contable.");
        }
        else if( $scope.frmConciliacion.idFinanciera == 0){
            swal("Conciliación","No se ha especificado la financiera.");   
        }
        else if( !$scope.frmConciliacion.loadLayout ){
            swal("Conciliación","No se ha cargado el Layout.");
        }
        else if( !$scope.frmConciliacion.lbltipoconciliacion ){
            swal("Conciliación","No se ha seleccionado el tipo de conciliación.");
        }
        else{
            $scope.validaExistencia().then( ( result ) => {
                if( result === undefined ){
                    swal("Conciliación","Se perdio la conexión al servidor, favor de verificar su conexión.");
                }
                else if( result.success == 0 ){
                    swal("Conciliación","Ya se encuentra una conciliación para el periodo y financiera especificada.");
                }
                else if( result.success == 1 ){
                    myDropzone.processQueue();
                    $scope.frmConciliacion.loadLayout = true;
                }
            })
        }
    };

    $scope.prevStep = function() {
        location.reload();
        $scope.currentPanel = 'pnlCargaArchivo';
    };

    $scope.setTableStyle = function(tblID) {
        staticFactory.setTableStyleOne(tblID);
    };

    $scope.fnAjusteManual = function(){
            $scope.ajusteManual = true;
    }

    $scope.setIntFinanToAjuste = function( indice ){
        $scope.lstConceal[ indice ].ajuste  = $scope.lstConceal[ indice ].interes;
        $scope.lstConceal[ indice ].esMayor = 3;
        
        $scope.total.sistema = 0;
        $scope.lstConceal.forEach(function(item) {
            if( item.equiparante == 1 ){
                $scope.total.sistema += item.ajuste;
            }
        });

        $scope.readyConciliation();
    }

    $scope.recalculo = function( indice ){
        console.log("indice", indice);
        console.log("$scope.lstConceal", $scope.lstConceal[ indice ].ajuste);

        if( isNaN( $scope.lstConceal[ indice ].ajuste ) ){
            $scope.lstConceal[ indice ].ajuste = 0;
        }

        $scope.total.sistema = 0;
        $scope.lstConceal.forEach(function(item) {
            if( item.equiparante == 1 ){
                $scope.total.sistema += parseFloat(item.ajuste);
            }
        });
        $scope.lstConceal[ indice ].esMayor = 3;
        $scope.readyConciliation();

        console.log( "total.sistema", $scope.total.sistema );
    }

    $scope.ajusteAutomatico = function(){
        $scope.ajusteManual = true;
        $scope.lstConceal.forEach(function(item, key) {
            if( item.equiparante == 1 && item.esMayor != 1 ){
                $scope.lstConceal[ key ].ajuste  = $scope.lstConceal[ key ].interes;
                $scope.lstConceal[ key ].esMayor = 3;
            }
        });
        
        $scope.total.sistema = 0;
        $scope.lstConceal.forEach(function(item) {
            if( item.equiparante == 1 ){
                $scope.total.sistema += item.ajuste;
            }
        });

        $scope.readyConciliation();
    }

    $scope.readyConciliation = function(){
        var modulo = parseFloat($scope.total.sistema) - parseFloat($scope.total.archivo);
        if( modulo >= -1 && modulo <= 1 ){
            $scope.conciliacion = true;
        }
        else{
            $scope.conciliacion = false;
        }        
       
    }

    $scope.creaConciliacion = function(estatus,contador) {
        $scope.idestatus=estatus;
        var parametros = {
            idEmpresa:      $scope.session.empresaID,
            idFinanciera:   $scope.frmConciliacion.idFinanciera,
            periodo:        parseInt($scope.currentMonth) + 1,
            periodoAnio:    $scope.currentYear,
            idUsuario:      $scope.idUsuario,
            idEstatus:       $scope.idestatus,
            idtipo:         $scope.frmConciliacion.lbltipoconciliacion,
            contador:       contador
        }
        var parametrosDetalle = {}
        var item = {};
        conciliacionFactory.creaConciliacion( parametros ).then(function(result) {
            if( result.data[0].success == 1 ){
                $scope.idconciliacion=result.data[0].LastId;

                for( var i = 0; i <= ( $scope.lstConceal.length - 1 ); i++ ){
                    item = $scope.lstConceal[ i ];
                    parametrosDetalle = {
                        idConciliacion:         result.data[0].LastId,
                        movimientoID:           item.movimientoID,
                        CCP_IDDOCTO:            item.CCP_IDDOCTO,
                        VIN:                    item.numeroSerie,
                        interesGrupoAndrade:    item.InteresMesActual,
                        interesFinanciera:      item.interes,
                        interesAjuste:          item.ajuste,
                        situacion:              ( item.equiparante == 1 && item.esMayor == 1 ) ? 1 : ( item.equiparante == 1 && item.esMayor != 1 ) ? 2 : 3 // 1 => Montos iguales; 2 => Monto Ajustado; 3 => No Aplica
                    }

                    conciliacionFactory.creaConciliacionDetalle( parametrosDetalle );

                }
            }
        });

    }
    $scope.guardaConciliacion = function() {
        var parametros = {
            idConciliacion:      $scope.idconciliacion,
            idEstatus:       1

        }
        var parametrosDetalle = {}
        var item = {};
        conciliacionFactory.guardaConciliacion( parametros ).then(function(result) {
            if( result.data[0].success == 1 ){
              

                for( var i = 0; i <= ( $scope.lstConceal.length - 1 ); i++ ){
                    item = $scope.lstConceal[ i ];
                    parametrosDetalle = {
                        idConciliacion:         $scope.idconciliacion,
                        movimientoID:           item.movimientoID,
                        CCP_IDDOCTO:            item.CCP_IDDOCTO,
                        VIN:                    item.numeroSerie,
                        interesGrupoAndrade:    item.InteresMesActual,
                        interesFinanciera:      item.interes,
                        interesAjuste:          item.ajuste,
                        situacion:              ( item.equiparante == 1 && item.esMayor == 1 ) ? 1 : ( item.equiparante == 1 && item.esMayor != 1 ) ? 2 : 3 // 1 => Montos iguales; 2 => Monto Ajustado; 3 => No Aplica
                    }

                    conciliacionFactory.creaConciliacionDetalle( parametrosDetalle );

                    if( i >= ( $scope.lstConceal.length - 1 ) )
                    {
                       
                            swal("Conciliación","Se ha generado de forma correcta la conciliacion del mes de " + $scope.lstMonth[ $scope.currentMonth ],"success");
                            setTimeout( function(){
                                conciliacionFactory.generaConciliacion( parametros.periodo, $scope.currentYear, parametros.idFinanciera ).then( function( result ){
                                     location.reload();
                                   // $scope.prevStep();
                                    // location.href = "provision";

                                });
                            },2000);
                       
                    }
                }
            }
        });

    }
    $scope.solicitaAutorizacion = function( estatus ) {
        var parametros = {
            consecutivo: contador,
            estatus: estatus,
            idUsuario: $scope.idUsuario,
            idFinanciera: $scope.frmConciliacion.idFinanciera,
            periodoContable: parseInt($scope.currentMonth) + 1,
            anioContable: $scope.currentYear,
            idconciliacion: $scope.idconciliacion
        }

        swal({
            title: "Conciliación", 
            text: "¿Esta seguro de completar esta acción?",
            type: "warning",
            showCancelButton: true,
            closeOnConfirm: false,
            confirmButtonText: "Solicitar Autorización",
            confirmButtonColor: "#ec6c62",
            cancelButtonText: "Cerrar"
        }, function() {
            conciliacionFactory.solicitaAutorizacion( parametros ).then(function(result) {
                if( result.data[0].success == 1 ){
                    for( var i = 0; i <= ( $scope.lstConceal.length - 1 ); i++ ){
                        if( parametros.estatus == 1 ){
                            swal("Listo", "La se ha realizado la notificacón, favor de esperar su respuesta", "success");
                        }
                        else{
                            swal("Listo", "Se ha guardado de forma correcta tus registros.", "success");
                        }
                        $scope.estSolAutorizacion = 2;
                      //  $scope.$apply();
                    }
                }
            });
        });
    }

    $scope.openModalConciliacion = function(){
        $("#modalNuevaConciliacion").modal('show');
        $scope.Dropzone();
        $scope.tipoConciliacion=1;
    }

    $scope.resetFromulario = function(){
        $scope.frmConciliacion.idFinanciera = 0;
        $scope.Dropzone();
    }

    $scope.porAutorizar = function(){
        conciliacionFactory.porAutorizar().then(function(result) {
            if( result.data.length != 0 ){
                $scope.lstPendiente = result.data;
                console.log( "$scope.lstPendiente", $scope.lstPendiente );
            }
        });
    }
   
    $scope.obtieneCociliacion = function(){
        var parametros = {
            idEmpresa:      $scope.session.empresaID,
            periodo:  $scope.currentPeriodo.periodo
        }
        conciliacionFactory.obtieneCociliacion(parametros).then(function(result) {
         
                $scope.lstConciliacion = result.data;
          
        });
    }

    $scope.regresaConciliacionPanel = function(){        
        $scope.currentPanel = 'pnlCargaArchivo';
    }

    $scope.showDetail = function(lote){
        $scope.titleDocumentosDetalle = lote.ple_concepto;
        provisionFactory.getLoteDetail(lote.ple_idplanpiso).then(function(result) {
            if( result.data.length != 0 ){
                $scope.lstUnitDeatil = result.data;
                $scope.currentPanel = 'pnlDocumentosDetalle';
            }
        });
    }

    $scope.regresaConciliacionDocumento = function(){
        $scope.currentPanel = 'pnlDocumentos';
    }
    ////////////////////////////////////////////////////
    /////////////////////////Compra VIrtual
    $scope.CompraVirtual = function(){
        $scope.currentPanel = 'pnlCompraVirtual';
        commonFactory.getSucursal($scope.session.empresaID, $scope.idUsuario).then(function(result) {
            $scope.lstSucursal = result.data;
        });
        commonFactory.getFinancial($scope.session.empresaID).then(function(result) {
            $scope.lstFinancial = result.data;
        });
        conciliacionFactory.getUnidadesCompraVirtual($scope.idconciliacion).then(function(result) {
            $scope.lstNewUnits = result.data;
            $scope.initTblProviders();
            $('#mdlLoading').modal('hide');
        });
    }

    $scope.currentSucursalName = "Sucursal Todas";
    $scope.currentFinancialName = "Seleccionar Financiera";
    $scope.FinancieraSel = [];
    $scope.selectedSchema = [];
    $scope.topBarNav = conciliacionFactory.topNavBar();
    $scope.steps = conciliacionFactory.stepsBar();

    $scope.currentStep = 0;
    $scope.showStep = 1;
    // $scope.topBarNav = staticFactory.conciliacionBar();
    // $scope.lstPayTypes = [];
    // $scope.lstUnitsPending = [];
    // $scope.lstUnitsApply = [];
    // $scope.lstUnitDeatil = [];
    // $scope.objEdit = { visible: false };
    // $scope.currentPanel = 'pnlPendientes';
    // $scope.currentPayName = 'Todos';
    // $scope.showDropDown = true;
  //  $('#mdlLoading').modal('show');

   
   
    $scope.initTblProviders = function() {
        $scope.setTableStyle('#tblUnidadesconciliacion');
        $scope.totalUnidades = $scope.lstNewUnits.length;
    };
    $scope.setTableStyle = function(tableID) {
        staticFactory.setTableStyleOne(tableID);
    };

    $scope.nextStep = function() {
        var contador = 0;
        var Financiera=  _.where($scope.lstFinancial, { financieraID: $scope.frmConciliacion.idFinanciera })[0];
        $scope.setCurrentFinancialHead(Financiera);
        angular.forEach($scope.lstNewUnits, function(value, key) {
            
                contador++;
   
        });
        if ($scope.currentStep === 0 && contador === 0) {
            swal("Aviso", "No ha seleccionado ningun documento", "warning");
            return;
        } else if ($scope.currentStep === 1 && $scope.selectedSchema.esquemaID === undefined && $scope.SucursalSel.sucursalID === undefined) {
            if ($scope.FinancieraSel.nombre === undefined) {
                swal("Aviso", "No ha seleccionado un esquema", "warning");
                return;
            } else  if ($scope.SucursalSel.sucursalID === undefined) {
                swal("Aviso", "No ha seleccionado una sucursal", "warning");
                return;
            }
            else {
                swal("Aviso", "Debe seleccionar una financiera para continuar el proceso", "warning");
                return;
            }

        } else if (($scope.currentStep + 1) < $scope.steps.length) {
            $scope.steps[$scope.currentStep].className = "visited";
            $scope.currentStep++;
            $scope.showStep = $scope.currentStep + 1;
        //    $scope.currentPanel = $scope.steps[$scope.currentStep].panelName;
            $scope.steps[$scope.currentStep].className = "active";
            $scope.showFilterButtons($scope.currentStep);
        }
    };


    $scope.prevStep2 = function() {
        if (($scope.currentStep - 1) >= 0) {
            $scope.steps[$scope.currentStep].className = "visited";
            $scope.showStep = $scope.currentStep;
            $scope.currentStep--;
            $scope.steps[$scope.currentStep].className = "active";
            $scope.showFilterButtons($scope.currentStep);
        }
    };
    $scope.showFilterButtons = function(step) {
        if (step === 0)
            $scope.ddlFinancialShow = false;
        else
            $scope.ddlFinancialShow = true;
    };
    $scope.setCurrentFinancialHead = function(financialObj) {
        $scope.FinancieraSel = financialObj;
  //      $('#mdlLoading').modal('show');
        $scope.currentFinancialName = financialObj.nombre;
        // $scope.getNewUnitsBySucursal($scope.session.empresaID, $scope.SucursalSel.sucursalID,$scope.FinancieraSel.financieraID);
        $scope.getSchemas($scope.FinancieraSel.financieraID);
    };
    $scope.getSchemas = function(financieraID) {
        commonFactory.getSchemas(financieraID).then(function(result) {
            $('#tblSchemas').DataTable().destroy();
            $scope.lstSchemas = result.data;
            $('#mdlLoading').modal('hide');
        });
    };

    $scope.setCurrentSucursal = function(sucursalObj) {
        $scope.SucursalSel = sucursalObj;
      
        $scope.currentSucursalName = sucursalObj.nombreSucursal;
        };
    $scope.uncheckSchemas = function(itemSchemas) {
        for (var i = 0; i < $scope.lstSchemas.length; i++) {
            $scope.lstSchemas[i].isChecked = false;
        }
        itemSchemas.isChecked = true;
        $scope.selectedSchema = itemSchemas;
    };
    $scope.showMsg = function() 
    {
        swal({
            title: "¿Estas Seguro?",
            text: "Se hara una compra virtual por los autos designados.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#21B9BB",
            confirmButtonText: "Continuar",
            closeOnConfirm: false
        },
        function() 
        {
            var paraconciliacion = {
                idUsuario: $scope.idUsuario,
                idEmpresa: $scope.session.empresaID,
                idtipopoliza:5 //Compra virtual
            }

            conciliacionFactory.conciliacionPoliza(paraconciliacion).then(function( respuesta ) {
                $scope.LastId = respuesta.data[0].LastId;
                $scope.lstUnitsconciliacions =  $scope.lstNewUnits;
                $scope.guardaDetalle();
            }, function(error) {
                $scope.error(error.data.Message);
            });
           
            
            
        });
    };
    
    $scope.LastId = 0;
    var contconciliacionDetalle = 0;
    $scope.guardaDetalle = function(){
        if( contconciliacionDetalle < $scope.lstUnitsconciliacions.length ){
            var item = $scope.lstUnitsconciliacions[ contconciliacionDetalle ];
           
            var paraconciliacionDetalle = {
                idpoliza: $scope.LastId,
                idconciliacion: $scope.idconciliacion,
                idsucursal: $scope.SucursalSel.sucursalID,
                VIN: item.VIN,
                Marca : item.Marca,
                idfinancieraO: $scope.FinancieraSel.financieraID,
                idEsquemaO: $scope.selectedSchema.esquemaID,
                Descripcion: item.descModelo,
                Modelo: item.Modelo,
                Costo: item.valor,
                idUsuario: $scope.idUsuario
            }

            conciliacionFactory.conciliacionPolizaDetalle(paraconciliacionDetalle).then(function( response ) {
                if( response.data.length != 0 ){
                    if( contconciliacionDetalle < $scope.lstUnitsconciliacions.length ){
                        contconciliacionDetalle++;
                        $scope.guardaDetalle();
                    }
                }
            }, function(error) {
                $scope.error(error.data.Message);
            });
        }
        else{
            // swal("conciliacion Plan Piso", "Se ha efectuado correctamente su conciliacion.");
            conciliacionFactory.procesaconciliacion($scope.LastId).then(function( response ) {
                if( response.length != 0 ){
                    swal(
                    {
                        title: "Unidades de conciliacion Plan Piso",
                        text: "Se ha efectuado correctamente su póliza.",
                        type: "warning"
                    }, function(){
                        location.reload();
                    });
                }
            }, function(error) {
                $scope.error(error.data.Message);
            });
        }
    }
});