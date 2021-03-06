import { Component, OnInit, OnDestroy, NgZone } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Location } from '@angular/common'
import { LocalDataSource } from 'ng2-smart-table'

import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { MapaOrdenesComponent } from './mapa-ordenes/mapa-ordenes.component'
import { MapBoxOrdenesComponent } from './map-box-ordenes/map-box-ordenes.component'

// Rxjs
import { Subscription } from 'rxjs'
import { switchMap, map } from 'rxjs/operators'

// Libs terceros
import Swal from 'sweetalert2'

// AngularFire - Firebase
import * as firebase from 'firebase'

// Services
import { VendedorService } from '../../../@core/data/vendedor/vendedor.service'
// Models
import { BasicInfoOrden } from '../../../@core/data/vendedor/models/basicInfoOrden'
import { Orden } from '../../../@core/data/orden/models/orden'

@Component({
  selector: 'ngx-vendedor',
  templateUrl: './vendedor.component.html',
  styleUrls: ['./vendedor.component.scss']
})
export class VendedorComponent implements OnInit, OnDestroy {

  private _vendedor: string = ''
  private _IdAsesor: string = ''
  private _params: any
  private _paramsSub: Subscription
  private _ordenesGps: Orden[] = []

  /**
   * objeto de configuracion para ng2-smart-table
   */
  private settings = {
    noDataMessage: 'No hay datos en este momento',
    actions : {
      add: false,
      edit : false,
      delete : false
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>'
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>'
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true
    },
    columns: {
      id: {
        title: 'Id Orden',
        sortDirection: 'desc'
      },
      cliente: {
        title: 'Cliente NIT'
      },
      created_at: {
        title: 'Fecha'
      },
      total: {
        title: 'Total'
      },
      cantItems: {
        title: 'Items'
      },
      ubicacion: {
        title: 'Ubicacion',
        type: 'html'
      },
      estado: {
        title: 'Estado',
        type: 'html'
      }
    }
  }
  private source: LocalDataSource = new LocalDataSource()

  constructor (
    private vendedoresService: VendedorService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private location: Location,
    private modalService: NgbModal,
    private zone: NgZone
  ) {}

  ngOnInit () {
    this._paramsSub = this.activatedRoute.queryParams.pipe(
      switchMap(params => this.vendedoresService.vendedorServIsInit$.pipe(map(users => users ? params : null)))
    ).subscribe(params => {
      if (params) {
        this.zone.run(() => {
          this._vendedor = params.name
          this._IdAsesor = params.idAsesor
          this.vendedoresService.bdName = params.uid
          this._params = params

          const data = this.vendedoresService.formatOrdenesVendedor()
          console.log('ordenes vendedor', data.ordenesInfo)
          this._ordenesGps = data.ordenesGps
          this.source.load(data.ordenesInfo)
        })
      }
    })
  }

  ngOnDestroy () {
    this._paramsSub.unsubscribe()
  }

  private onUserRowSelect (evt): void {
    console.log('El buen evento', evt)
    this.router.navigate(['pages/ordenes', this._params.uid, evt.data.id])
  }

  private back (): void {
    this.location.back()
  }

  private verUbicacion (): void {
    const activeModal = this.modalService.open(MapaOrdenesComponent, { size: 'lg', container: 'nb-layout' })
    activeModal.componentInstance.ordenes = this._ordenesGps
  }

  private verUbicacion2 (): void {
    const activeModal = this.modalService.open(MapBoxOrdenesComponent, { size: 'lg', container: 'nb-layout' })
    activeModal.componentInstance.userId = this._vendedor
  }

  private async activarUsuario (): Promise<void> {
    const { value: idAsesor } = await Swal({
      title: 'Ingrese el ID del asesor',
      input: 'text',
      showCancelButton: true,
      inputValidator: (value) => {
        return !value && 'No puedes dejar el campo en blanco'
      }
    })

    if (idAsesor) {
      console.log('valor del pinche value', idAsesor)
      try {
        await this.vendedoresService.updateUserData({
          idAsesor : idAsesor
        })

        Swal({
          title: 'Activado!',
          text: 'El usuario ha sido activado con exito.',
          type: 'success'
        })

        this._IdAsesor = idAsesor
        this.location.back()

      } catch (error) {
        Swal({
          title: 'Error!',
          text: 'Ocurrio un error al activar el usuario.',
          type: 'error'
        })
        console.error('Error al activar el pinche usuario:', error)
      }
    }

  }

}
