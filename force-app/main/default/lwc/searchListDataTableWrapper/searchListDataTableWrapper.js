import { LightningElement, api, track, wire } from "lwc";
import getRecords from "@salesforce/apex/SearchListController.getRecords";
import getFieldDetails from "@salesforce/apex/SearchListController.getFieldDetails";

export default class SearchListDataTableWrapper extends LightningElement {
  @track allRecords;
  @track filteredRecords;
  @track viewRecords;
  @track columns;
  @track defaultSortDirection = "asc";
  @track sortDirection = "asc";
  @track sortedBy;
  @track recordCount = 0;
  @track hasRecords = false;
  @track beginIndex = 0;
  @track endndex = 0;
  @track currentPage = 0;
  @track totalPages = 0;
  @track disableBack = true;
  @track disableForward = true;
  @track searchText = "";
  @track objectPluralName = "";
  @api objectName;
  @api fieldsToQuery;
  @api filters;
  @api disableSort;
  @api disableSearch;
  @api recordsPerPage;
  error;

  //Properties for Message / Alert
  @track hasMessage;
  @track pageMessageParentDivClass =
    "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_warning";
  @track pageMessageChildDivClass =
    "slds-icon_container slds-icon-utility-warning slds-m-right_x-small";
  @track messageTitle = "No Records";
  @track messageSummary = "No records found.";
  @track messageIcon = "utility:warning";


  @api doSearch() {
    console.log('doSearch called>>>');
    console.log('this.filters >>>' + this.filters);
    getRecords({
      objectName: this.objectName,
      fieldsToQuery: this.fieldsToQuery,
      filters: this.filters
    })
      .then((result) => {
        this.error = undefined;
        console.log('getRecords called>>>');
        console.log('result >>>' + result);
        if (result) {
          var allRecords = [];
          for (var index in result) {
            var record = result[index];
            var compatibleRecord = {};
            for (var key in record) {
              if (typeof record[key] == "object") {
                for (var childKey in record[key]) {
                  var parentChildkey = key + "_" + childKey;
                  compatibleRecord[parentChildkey] = record[key][childKey];
                }
              } else {
                compatibleRecord[key] = record[key];
              }
            }
            allRecords.push(compatibleRecord);
            allRecords.forEach(
              (item) =>
              (item["RecordURL"] =
                "/" + item["Id"])
            );
            //console.log(compatibleRecord);
          }
          this.allRecords = allRecords;
          this.filteredRecords = allRecords;
          if (this.allRecords && this.allRecords.length > 0) {
            this.hasRecords = true;
            this.hasMessage = false;
          } else {
            this.hasRecords = false;
            this.hasMessage = true;
            this.preparePageMessage(
              "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_warning",
              "slds-icon_container slds-icon-utility-warning slds-m-right_x-small",
              "No Records",
              "No records found.",
              "utility:warning"
            );
          }
          //console.log(this.filterRecords);
          this.filterRecords(0);
        }
      })
      .catch((error) => {
        this.error = error;
        console.warn(error);
        this.allRecords = undefined;
        this.hasRecords = false;
        this.hasMessage = true;
        
        this.preparePageMessage(
          "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error",
          "slds-icon_container slds-icon-utility-error slds-m-right_x-small",
          "Error",
          error.body.exceptionType +
          " " +
          error.body.message +
          " " +
          error.body.stackTrace,
          "utility:error"
        );
        
      });
  }

  connectedCallback() {
    getFieldDetails({
      objectName: this.objectName,
      fieldsToQuery: this.fieldsToQuery,
      filters: this.filters
    })
      .then(result => {
        this.contacts = result;
        var columns = [];
        if (result) {
          columns.push({
            label: "Name",
            fieldName: "RecordURL",
            type: "url",
            typeAttributes: {
              label: {
                fieldName: "Name"
              }
            }
          });
          for (var fieldName in result) {
            console.log(result[fieldName]);
            var fieldLabel = result[fieldName]["label"];
            var fieldDisplaytype = result[fieldName]["displaytype"];
            var fieldApiName = result[fieldName]["apiname"];
            if (fieldApiName.toUpperCase() === 'NAME' || 
            fieldApiName.toUpperCase() === 'PUBLISHEDTITLE__C'
            ) {
              continue;
            }
            columns.push({
              label: fieldLabel,
              fieldName: fieldApiName,
              type: fieldDisplaytype,
              sortable: true
            });
            this.objectPluralName = result[fieldName]["objectPluralName"];
            console.log(this.objectPluralName);
          }
          this.columns = columns;
          this.hasMessage = false;
          console.log(this.columns);
        }
      })
      .catch(error => {
        console.log(error);
        this.hasMessage = true;
        this.hasRecords = false;
        
        this.preparePageMessage(
          "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error",
          "slds-icon_container slds-icon-utility-error slds-m-right_x-small",
          "Error",
          error.body.exceptionType +
          " " +
          error.body.message +
          " " +
          error.body.stackTrace,
          "utility:error"
        );
        
      });
  }

  sortBy(field, reverse, primer) {
    const key = primer
      ? function (x) {
        return primer(x[field]);
      }
      : function (x) {
        return x[field];
      };
    return function (a, b) {
      a = key(a) === undefined ? "" : key(a);
      b = key(b) === undefined ? "" : key(b);
      a = a.toString().toLowerCase();
      b = b.toString().toLowerCase();
      return reverse * ((a > b) - (b > a));
    };
  }

  onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    const cloneData = [...this.filteredRecords];
    cloneData.sort(this.sortBy(sortedBy, sortDirection === "asc" ? 1 : -1));
    this.filteredRecords = cloneData;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;
    this.filterRecords(0);
  }

  goToFirst(event) {
    this.filterRecords(0);
  }

  goToPrevious(event) {
    var newIndex = this.beginIndex - Number(this.recordsPerPage);
    newIndex--;
    this.filterRecords(newIndex);
  }

  goToNext(event) {
    var newIndex = this.beginIndex + Number(this.recordsPerPage);
    newIndex--;
    this.filterRecords(newIndex);
  }

  goToLast(event) {
    var newIndex = (this.totalPages - 1) * Number(this.recordsPerPage);
    this.filterRecords(newIndex);
  }

  handleSearchText(event) {
    this.searchText = event.target.value;
    console.log(this.searchText);
    if (this.searchText && this.searchText.length >= 2) {
      var filteredRecords = [];
      for (var index in this.allRecords) {
        var record = this.allRecords[index];
        for (var key in record) {
          var value = record[key].toString();
          if (
            value &&
            value.length > 0 &&
            value.toLowerCase().includes(this.searchText.toLowerCase())
          ) {
            filteredRecords.push(record);
          }
        }
      }
      this.filteredRecords = filteredRecords;
    } else {
      this.filteredRecords = this.allRecords;
    }
    this.filterRecords(0);
  }

  filterRecords(startingIndex) {
    if (this.filteredRecords && this.filteredRecords.length > 0) {
      this.recordCount = this.filteredRecords.length;
      this.totalPages = Math.ceil(
        this.recordCount / Number(this.recordsPerPage)
      );
      var viewRecords = [];
      var endingIndex = startingIndex + Number(this.recordsPerPage);
      if (endingIndex > this.recordCount) {
        endingIndex = this.recordCount;
      }
      this.beginIndex = startingIndex + 1;
      this.endndex = endingIndex;

      var index = startingIndex;
      this.currentPage = Math.ceil(
        this.beginIndex / Number(this.recordsPerPage)
      );
      while (index < endingIndex) {
        viewRecords.push(this.filteredRecords[index]);
        index++;
      }
      this.viewRecords = viewRecords;
    } else {
      this.recordCount = 0;
      this.totalPages = 0;
      this.currentPage = 0;
      this.beginIndex = 0;
      this.endndex = 0;
      this.viewRecords = [];
    }
    this.renderButtons();
  }

  preparePageMessage(
    pageMessageParentDivClass,
    pageMessageChildDivClass,
    messageTitle,
    messageSummary,
    messageIcon
  ) {
    this.pageMessageParentDivClass = pageMessageParentDivClass;
    this.pageMessageChildDivClass = pageMessageChildDivClass;
    this.messageTitle = messageTitle;
    this.messageSummary = messageSummary;
    this.messageIcon = messageIcon;
  }

  renderButtons() {
    if (this.beginIndex < Number(this.recordsPerPage)) {
      this.disableBack = true;
    } else {
      this.disableBack = false;
    }

    if (this.currentPage == this.totalPages) {
      this.disableForward = true;
    } else {
      this.disableForward = false;
    }
  }
}