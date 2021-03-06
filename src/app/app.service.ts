import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { MouseEvent } from '@agm/core';

//Organisation Units API
const ORGANISATION_UNITS_API_FIELDS = ['id', 'parent', 'code', 'name', 'shortName', 'level', 'children["id",code","name","shortName","level"']
const ORGANISATION_UNITS_BASE_API_FIELDS = ['id', 'code', 'name', 'shortName', 'level']
const ORG_UNIT_BASE_API = '../../../api/organisationUnits.json'
const ORG_UNIT_API = '../../../api/organisationUnits.json?fields=' + ORGANISATION_UNITS_API_FIELDS.join(',')
const INNER_ORG_UNIT_API = '../../../../../organisationUnits.json?fields=' + ORGANISATION_UNITS_API_FIELDS.join(',')
//For Match Results
const STATUS_MATCHED = 'Matched'
const STATUS_UNMATCHED = 'Unmatched'
const STATUS_DUPLICATES = 'Duplicates'

@Injectable({
  providedIn: 'root'
})
export class AppService implements OnInit {
  //Counts Total Organisation Units
  public dataCount = 0;
  //Stores Organisation Units
  public apiResult = []
  //Stores Geospatial file contents Object
  public featureCollection: any
  //Stores Match Result
  public count = 0
  //Organisation Unit api
  public organisationUnitsApi: string


  public show = false

  //For Searching
  private _search_keyword_code = ''
  private _search_keyword_name = ''
  private _search_keyword_short_name = ''
  private _search_keyword_feature_type = ''
  private _search_keyword_level = 'All'
  private _search_keyword_geometry_type = ''

  //Searching within Match Results
  private _status_matches = 'All'

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.organisationUnitsApi = ORG_UNIT_API
    this.dataCount = 0;

    this.apiResult = [];

    this.http.get(ORG_UNIT_API).subscribe((response: any) => {
      this.dataCount = response.pager.total;
      // tslint:disable-next-line:no-shadowed-variable
      response.organisationUnits.forEach(element => {
        this.apiResult.push(element);
        this.count++
      });
      const startAt = response.pager.page + 1;
      const pageCount = response.pager.pageCount;
      for (let i = startAt; i <= pageCount; i++) {
        this.http.get(+'../' + ORG_UNIT_API + '&page=' + i).subscribe((response_2: any) => {
          // tslint:disable-next-line:no-shadowed-variable
          response_2.organisationUnits.forEach(element => {
            this.apiResult.push(element);
            this.count++
          });
        });
      }
    });
  }

  //Get All Organisation Units
  getOrganisationUnits() {
    return [...this.apiResult]
  }

  //Get load Progress
  getLoadProgress() {
    return parseFloat((this.apiResult.length / this.dataCount).toFixed(2))
  }

  //Counts Organisation Units
  getOrganisationUnitsCount() {
    return this.apiResult.length
  }

  getOrganisationUnitLevelName(level: number) {
    switch (level) {
      case 1:
        return 'Country'
      case 2:
        return 'Region'
      case 3:
        return 'Council'
      case 4:
        return 'Facility'
    }
  }

  getOrganisationUnitLevelCode(level: string) {
    switch (level.toLocaleLowerCase()) {
      case 'facility':
        return 4
      case 'council':
        return 3
      case 'region':
        return 2
      case 'country':
        return 1
      default: return 0
    }
  }

  search(pattern: string, organisationUnits: any[]) {
    switch (pattern) {
      case 'CODE':
        return organisationUnits.filter(organisationUnit =>
          organisationUnit.code.toLowerCase().
            includes(this._search_keyword_code.toLowerCase()))
      case 'NAME':
        return organisationUnits.filter(organisationUnit =>
          organisationUnit.name.toLowerCase().
            includes(this._search_keyword_name.toLowerCase()))
      case 'SHORT_NAME':
        return organisationUnits.filter(organisationUnit =>
          organisationUnit.shortName.toLowerCase().
            includes(this._search_keyword_short_name.toLocaleLowerCase())
        )
      case 'LEVEL':
        if (this._search_keyword_level == 'All') {
          return organisationUnits
        }
        return organisationUnits.filter(organisationUnit =>
          organisationUnit.level == this.
            getOrganisationUnitLevelCode(this._search_keyword_level))
      default:
        return organisationUnits
    }
  }

  updateCodeInput(event) {
    this._search_keyword_code = event.target.value
  }
  updateNameInput(event) {
    this._search_keyword_name = event.target.value
  }
  updateShortNameInput(event) {
    this._search_keyword_short_name = event.target.value
  }
  updateLevelInput(level: string) {
    this._search_keyword_level = level
  }

  updateFeatureTypeInput(event) {
    this._search_keyword_feature_type = event.target.value
  }

  updateMatchStatus(match_status: string) {
    this._status_matches = match_status

    console.log(this._status_matches)
  }

  updateGeometryTypeInput(event) {
    this._search_keyword_geometry_type = event.target.value
  }

  searchFeatures(pattern: string, features: any[]) {
    switch (pattern) {
      case 'FEATURE':
        return features.filter(feature => feature.type.toLocaleLowerCase().
          includes(this._search_keyword_feature_type.toLocaleLowerCase()))
      case 'NAME':
        return features.filter(
          feature => feature.properties.name.toLowerCase().includes(this._search_keyword_name.toLowerCase())
        )
      case 'GEOMETRY':
        return features.filter(
          feature => feature.geometry.type.toLowerCase().
            includes(this._search_keyword_geometry_type.toLowerCase())
        )
      case 'LEVEL':
        if (this._search_keyword_level == 'All') {
          return features
        }
        return features.filter(feature =>
          feature.le == this.
            getOrganisationUnitLevelCode(this._search_keyword_level))
      default:
        return features
    }
  }

  getMatchResultsCount(status_type: string) {

    switch (status_type) {
      case 'Matched':
        return 1
      case 'Unmatched':
        return 0

    }

  }

  searchResults(pattern: string, results: any[]) {

    switch (pattern) {
      case 'NAME':
        return results.filter(result => result.feature.properties.name
          .toLocaleLowerCase().includes(this._search_keyword_name.toLocaleLowerCase()))
      case 'LEVEL':
        if (this._search_keyword_level == 'All') {
          return results
        }
        return results.filter(result =>
          result.feature.le == this.
            getOrganisationUnitLevelCode(this._search_keyword_level))
      case 'MATCH_STATUS':

        switch (this._status_matches) {
          case STATUS_MATCHED:
            return results.filter(result => result.results.length == 1)
          case STATUS_UNMATCHED:
            return results.filter(result => result.results.length == 0)
          case STATUS_DUPLICATES:
            return results.filter(result => result.results.length > 1)
          default:
            return results

        }
      default:
        return results
    }
  }

  //Fetched Child Organisation Unit given parent UID
  getChildren(parentId: string) {
    let children = []
    this.apiResult.forEach(function (orgUnit) {
      if (orgUnit.level != 1 && orgUnit.parent.id == parentId) {
        children.push(orgUnit)
      }
    })
    return children
  }

  //Shows and Hides low Level Org Units whose parent id is @parentId
  updateChildrenDisplay(parentId: string, event: any) {
    let childRows = document.getElementsByClassName(parentId)
    for (let count = 0; count < childRows.length; count++) {
      if (childRows[count].hasAttribute('hidden')) {
        //Show
        childRows[count].removeAttribute('hidden')
        event.target.removeAttribute('class')
        event.target.setAttribute('class', 'fa fa-minus-square')
      } else {
        //Hide
        childRows[count].setAttribute('hidden', '')
        event.target.removeAttribute('class')
        event.target.setAttribute('class', 'fa fa-plus-square')
      }
    }
    
  }

  //Collapses all Child Org Units when parent Row is collapsed
  collapseAll(parentId: String) {
    alert('It works')
    return
    for (let childCount = 0; childCount < this.apiResult.length; childCount++) {
      if (this.apiResult[childCount].parent.id == parentId) {
        let childId = this.apiResult[childCount].id
        let rowsToHide = document.getElementsByClassName(childId)
        for (let rowCount = 0; rowCount < rowsToHide.length; rowCount++) {
          rowsToHide[rowCount].setAttribute('hidden', '')
        }
      }
    }
  }

  //Finds an Organisation Unit from the collection given its uid
  findOrganisationUnit(uid:string){
    return this.apiResult.filter(orgUnit => orgUnit.id == uid)
  }

  //Finds Organisation Unit from file given its uid
  findOrgUnitFromFile(uid:string){
    return this.featureCollection
  }

  
}

