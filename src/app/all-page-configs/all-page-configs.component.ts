import { Component, OnInit, ElementRef } from '@angular/core';
// import { ExportService } from '../export.service';
import { DataStoreService } from '../data-store.service';
import * as FileSaver from 'file-saver';
import { field, PageDetail } from '../global.model';
import swal from 'sweetalert2';
import { StaticPagesService } from '../static-pages.service';


@Component({
  selector: 'app-all-page-configs',
  templateUrl: './all-page-configs.component.html',
  styleUrls: ['./all-page-configs.component.css'],
  host: {
    '(document:click)': 'onClick($event)',
  }
})
export class AllPageConfigsComponent implements OnInit {

  page: PageDetail = {
    name: 'Page Name...',
    pageType: '',
    pageConfigId: '',
    pageOrder: null,
    minTime: null,
    maxTime: null,
    minMaxTimeUnit: null,
    show: false,
    activeStatus: 'inactive'
  };

  updatePageDetail: PageDetail;

  allPages: PageDetail[] = [];

  isPageUpdate = false;
  showPreview = false;
  showAddPageModal = false;
  modalTitle = "";
  fileModalTitle = "Upload Worksheet Config";
  templateTitle = "Select Page Template";
  showUploadJsonModal = false;
  showUseTemplatesModal = false;
  menuCheckBox = false;
  fieldApiMapping = {
    Custom: {},
    List: {}
  };
  menuClicked=false;
  justEnabled = true;
  configSheet = {
    Id: '',
    Name: ''
  };
  configSheetName = '';
  sheetDetails;
  showNextStep = false;
  constructor(private dataStoreService: DataStoreService, private staticPagesService:StaticPagesService, private _eref: ElementRef) { }

  onClick(event) {
   if (event.target.innerHTML != 'Select an action'){
       this.menuClicked = false;
   } 

  }
  ngOnInit() {
    this.dataStoreService.allPages.subscribe((pages: PageDetail[]) => {
      this.allPages = pages || [];
      if(this.allPages.length > 0){
          this.showNextStep = true;
      }
    });
    this.showThisPage(0);
    this.sheetDetails = JSON.parse(localStorage.getItem("configSheet"));
    if (this.sheetDetails) {
      this.configSheet = this.sheetDetails;
    }
  }

  enableMenu(){
      if(this.showNextStep){
        this.justEnabled = true;
        this.menuClicked = !this.menuClicked;
      }
      
  }
  disableMenu(){
/*    if(!this.justEnabled){        
        this.menuClicked = false;
    }
    this.justEnabled = false; */
  }

save(){
    this.showNextStep = true;
}
  onModalClose() {
    this.showPreview = false;
    this.showAddPageModal = false;
    this.showUploadJsonModal = false;
    this.showUseTemplatesModal = false;
    this.modalTitle = "";
  }

  preview() {
    this.showPreview = true;
  }

  addPage() {
    // this.dataStoreService.addToPageCongifgs(JSON.parse(JSON.stringify(this.page)));
    // this.allPages = this.dataStoreService.getPageConfigs();
    this.showAddPageModal = true;
    this.modalTitle = "Add New Page";
    this.isPageUpdate = false;
    this.updatePageDetail = null;
    // this.allPages.push(JSON.parse(JSON.stringify(this.page)));
  }

  savePageDetails(page: PageDetail) {
    if (this.isPageUpdate) {
      for (let p in this.allPages) {
        if (this.allPages[p].id === page.id) {
          this.allPages[p] = page;
          break;
        }
      }
    } else {
      page.id = Math.floor(Date.now() / 1000);
      this.allPages.push(page);
    }
    this.allPages.sort(this.compare);
    this.dataStoreService.allPages.next(this.allPages);
    this.updatePageDetail = null;
    this.showThisPageById(page.id);
  }

  editPage(page: PageDetail) {
    this.showAddPageModal = true;
    this.modalTitle = "Update Page";
    this.updatePageDetail = page;
    this.isPageUpdate = true;
  }

  removePageDetail() {
    swal({
      title: 'Delete current tab',
      text: "Do you want to remove page?",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00B96F',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove!'
    }).then((result) => {
      if (result.value) {
        this.allPages = this.allPages.filter(page => page.id !== this.updatePageDetail.id);
        this.dataStoreService.allPages.next(this.allPages);
        this.showThisPage(0);
        this.updatePageDetail = null;
        this.showAddPageModal = false;
        this.modalTitle = "";
      }
    });
  }

  startFromScratch(){
       swal({
      title: 'Reset Worksheet',
      text: "You are about to delete your current worksheet. Do you want to continue?",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00B96F',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove!'
    }).then((result) => {
      if (result.value) {
        this.dataStoreService.allPages.next(null);       
        this.updatePageDetail = null;
        this.showAddPageModal = false;
        this.modalTitle = "";
        localStorage.clear();
        this.showNextStep = false;
      }
    });
  }
  
  savePage(page) {
    this.allPages = this.allPages.filter(p => page.id === p.id ? page : p);
    this.dataStoreService.allPages.next(this.allPages);
    swal({
      title: 'Success',
      text: "Successfully Saved !!",
      type: 'success',
      confirmButtonColor: '#00B96F',
      confirmButtonText: 'OK'
    });
  }

  exportFieldConfigs() {
    const fieldConfigs = [];
    for (const page of this.allPages) {
      let leftPanelOrder = 10;
      let rightPanelOrder = 10;
      let fieldConfig: any = {};
      page.leftPanel.forEach(element => {
        fieldConfig = {};
        fieldConfig.type = element.fieldConfigType;
        fieldConfig.name = element.label.length>80?element.label.subString(0,80):element.label;
        fieldConfig.fieldLabel = element.label;
        fieldConfig.description = element.description;
        fieldConfig.regex = element.regex;
        fieldConfig.notes = element.notes;
        fieldConfig.apiName = element.apiName=='Other'?element.otherApiName:element.apiName;
        fieldConfig.priority_options = element.priority_options;
        fieldConfig.displayOrder = 'Left Panel';
        fieldConfig.pageName = page.name;
        fieldConfig.pageConfigId = page.pageConfigId;
        fieldConfig.columnOrder = 10;
        fieldConfig.leftPanelStyles = element.leftPanelStyles;
        fieldConfig.Hide_on_Finalize = true;
        fieldConfig.Do_not_show_on_PDF = true;
        fieldConfig.Has_Conditional_Field=true;
        fieldConfig.order = leftPanelOrder;
        fieldConfig.headingType = element.headingType;
        leftPanelOrder = leftPanelOrder + 10;
        fieldConfigs.push(fieldConfig);
      });

      page.rightPanel.forEach(element => {
        fieldConfig = {};
        if ((element.type === '2in1row') || (element.type === '3in1row')) {
          element.subFields.forEach((subElement, colOrder) => {
            fieldConfig = {};
            fieldConfig.order = rightPanelOrder;
            fieldConfig.columnOrder = ((colOrder + 1) * 10);
            fieldConfig.pageName = page.name;
            fieldConfig.pageConfigId = page.pageConfigId;
            fieldConfig.type = subElement.fieldConfigType;
            fieldConfig.name = subElement.label.length>80?subElement.label.subString(0,80):subElement.label;
            fieldConfig.fieldLabel = subElement.label;
            fieldConfig.notes = subElement.notes;
            fieldConfig.apiName = subElement.apiName =='Other'?subElement.otherApiName:subElement.apiName;
            fieldConfig.priority_options = subElement.priority_options;
            fieldConfig.displayOrder = 'Right Panel';
            fieldConfig.Hide_on_Finalize = subElement.hideOnFinalize ? subElement.hideOnFinalize : 'FALSE';
            fieldConfig.Do_not_show_on_PDF = subElement.doNotShowOnPdf ? subElement.doNotShowOnPdf : 'FALSE';
            fieldConfig.Has_Conditional_Field = subElement.hasConditionalField ? subElement.hasConditionalField : 'FALSE';
            fieldConfig.headingType = subElement.headingType;
            fieldConfig.required=subElement.required;
            fieldConfig.Tooltip_Description=subElement.tooltipDescription;
            fieldConfig.autocompleteLookupField=subElement.autocompleteLookupField;
            fieldConfig.autocompleteLookupObject=subElement.autocompleteLookupObject;
            fieldConfigs.push(fieldConfig);
          });
          rightPanelOrder = rightPanelOrder + 10;
        } else {
          fieldConfig.pageName = page.name;
          fieldConfig.pageConfigId = page.pageConfigId;
          fieldConfig.order = rightPanelOrder;
          rightPanelOrder = rightPanelOrder + 10;
          fieldConfig.columnOrder = 10;
          fieldConfig.name = element.label.length>80?element.label.subString(0,80):element.label;
          fieldConfig.fieldLabel = element.label;
          fieldConfig.regex = element.regex;
          fieldConfig.notes = element.notes;
          fieldConfig.apiName = element.apiName=='Other'?element.otherApiName:element.apiName;
          if(fieldConfig.apiName == 'DeltakSRP__Academic_Program__c'){
                fieldConfig.type = 'Academic Program';
                fieldConfig.name = 'Degree Program';
          } else {
              fieldConfig.type = element.fieldConfigType;
          }
          fieldConfig.headingType = element.headingType;
          fieldConfig.priority_options = element.priority_options;
          fieldConfig.displayOrder = 'Right Panel';
          fieldConfig.Do_not_show_on_PDF = element.doNotShowOnPdf ? element.doNotShowOnPdf : 'FALSE';
          fieldConfig.Hide_on_Finalize = element.hideOnFinalize ? element.hideOnFinalize : 'FALSE';
          fieldConfig.Has_Conditional_Field = element.hasConditionalField ? element.hasConditionalField : 'FALSE';
          fieldConfig.headingType = element.headingType;
          fieldConfig.required=element.required;
          fieldConfig.Tooltip_Description=element.tooltipDescription;
          fieldConfig.autocompleteLookupField=element.autocompleteLookupField;
          fieldConfig.autocompleteLookupObject=element.autocompleteLookupObject;
          fieldConfigs.push(fieldConfig);
        }
      });
    }
    // this.checkForDuplicates(fieldConfigs);
    const fileNamePrefix = this.configSheetName + 'FieldConfig';
    this.exportToCsv(fieldConfigs, fileNamePrefix);
  }

  // checkForDuplicates (fieldConfigs) {
  //   fieldConfigs.forEach(element => {
      
  //   });
  // }

  exportPageConfigs() {
    const pageConfigs = [];
    for (const page of this.allPages) {
      let pageConfig: any = {};
      pageConfig.name = page.name;
      pageConfig.pageType = page.pageType;
      pageConfig.pageOrder = page.pageOrder;
      pageConfig.minTime = page.minTime;
      pageConfig.maxTime = page.maxTime;
      pageConfig.minMaxTimeUnit = page.minMaxTimeUnit;
      pageConfig.pageConfigId = page.pageConfigId;
      pageConfig.onlineAppConfigId = this.configSheet.Id;
      pageConfig.note=page.notes;
      pageConfigs.push(pageConfig);
    }
    const fileNamePrefix = this.configSheetName + 'PageConfig';
    this.exportToCsv(pageConfigs, fileNamePrefix);
  }

  pageNameUpdated(pageName, i) {
    // this.allPages = this.dataStoreService.getPageConfigs();
    this.allPages.forEach((element, index) => {
      if (index === i) {
        element.name = pageName;
      }
    });
  }

  showThisPage(i) {
    this.allPages.forEach((element, index) => {
      if (index === i) {
        element.show = true;
        element.activeStatus = 'active';
      } else {
        element.show = false;
        element.activeStatus = 'inactive';
      }
    });
  }

   showThisPageById(id) {
    this.allPages.forEach((element, index) => {
      if (this.allPages[index].id == id) {
        element.show = true;
        element.activeStatus = 'active';
      } else {
        element.show = false;
        element.activeStatus = 'inactive';
      }
    });
  }
  pageOrderUpdated(pageOrder, i) {
    this.allPages.forEach((element, index) => {
      if (index === i) {
        element.pageOrder = parseInt(pageOrder);
      }
    });
    this.allPages.sort(this.compare);
  }

  templateSelected (data) {
    this.showUseTemplatesModal = false;
    let page = this.staticPagesService.getTemplate(data);
    page.id = Math.floor(Date.now() / 1000);
    this.allPages.push(page);
    this.allPages.sort(this.compare);
    this.dataStoreService.allPages.next(this.allPages);
    this.updatePageDetail = null;
    this.showThisPageById(page.id);
  }

  exportAsJson() {
    let allJson = JSON.parse(localStorage.getItem("allPages"));
    const blob = new Blob([JSON.stringify(allJson)], { type: 'application/json' });
    FileSaver.saveAs(blob, this.configSheetName +'FormBuilder_' + (+new Date()) + '.json');
  }

  jsonDataUploaded(data) {
    var reader = new FileReader();
    let fileData = [];
    reader.onload = () => {
      fileData = JSON.parse((reader.result).toString());
      if (Array.isArray(fileData) && (typeof fileData[0] === 'object')) {
        let keys = Object.keys(fileData[0]);
        if ((keys.indexOf('leftPanel') !== -1) && ((keys.indexOf('rightPanel') !== -1))) {
          swal({
            title: 'Are you sure?',
            text: "",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#00B96F',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes!'
          }).then((result) => {
            if (result.value) {
              // this.allPages = fileData;
              this.dataStoreService.allPages.next(fileData);
              localStorage.setItem("allPages", JSON.stringify(fileData));
            }
          });
        } else {
          swal('Error', 'Uploaded JSON not in expected format!!!');
        }
      } else {
        swal('Error', 'Uploaded JSON not in expected format!');
      }
    };
    reader.readAsText(data);
  }

  /**
 * Saves the file on the client's machine via FileSaver library.
 *
 * @param buffer The data that need to be saved.
 * @param fileName File name to save as.
 * @param fileType File type to save as.
 */
  private saveAsFile(buffer: any, fileName: string, fileType: string): void {
    const data: Blob = new Blob([buffer], { type: fileType });
    FileSaver.saveAs(data, fileName);
  }

  /**
   * Creates an array of data to CSV. It will automatically generate a title row based on object keys.
   *
   * @param rows array of data to be converted to CSV.
   * @param fileName filename to save as.
   * @param columns array of object properties to convert to CSV. If skipped, then all object properties will be used for CSV.
   */
  public exportToCsv(rows: object[], fileName: string, columns?: string[]): string {
    if (!rows || !rows.length) {
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]).filter(k => {
      if (columns ? (columns.length > 0) : false) {
        return columns.includes(k);
      } else {
        return true;
      }
    });
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date
            ? cell.toLocaleString()
            : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      }).join('\n');
    this.saveAsFile(csvContent, `${fileName}.csv`, 'csv');
  }

  compare(a, b) {
    if (a.pageOrder < b.pageOrder) {
      return -1;
    }
    if (a.pageOrder > b.pageOrder) {
      return 1;
    }
    return 0;
  }

  configSheetDetailsUpdated() {
    localStorage.setItem('configSheet', JSON.stringify(this.configSheet));
    this.configSheetName = this.configSheet.Name ? (this.configSheet.Name + '__') : '';
  }
}
