import { LightningElement, api, track } from "lwc";

export default class SearchListCmp extends LightningElement {
  @track objectNameToSend;
  @track fieldNamesToSend;
  defaultFilter;
  @track filtersToSend;
  @track recordsPerPageToSend;
  @track disableSortToSend;
  @track disableSearchToSend;
  @track searchText;
  @track industryValue;
  @track fromDate;
  @track toDate;
  @track showTable;
  debugger;

  connectedCallback() {
    this.defaultValues();
  }

  handleReset(event) {
    this.template.querySelectorAll("lightning-input").forEach((element) => {
      if (element.type === "checkbox" || element.type === "checkbox-button") {
        element.checked = false;
      } else {
        element.value = null;
      }
    });
    this.defaultValues();
    this.handleSearch();
  }

  defaultValues() {
    this.objectNameToSend = "Account";
    this.fieldNamesToSend =
      "Name, Industry, Phone, CreatedDate";
    this.defaultFilter = "Id != NULL";
    this.filtersToSend = this.defaultFilter;
    this.recordsPerPageToSend = 200;
    this.disableSortToSend = true;
    this.disableSearchToSend = true;
    this.searchText = undefined;
    this.industryValue = '';
    this.fromDate = undefined;
    this.toDate = undefined;
    this.showTable = true;
  }

  get options() {
    return [
      { label: "Consulting", value: "Consulting" },
      { label: "Retail", value: "Retail" },
      { label: "Energy", value: "Energy" }
    ];
  }

  handleSearchTextChange(event) {
    this.searchText = event.target.value;
    this.handleFilterChange();
  }

  handleTypeChange(event) {
    this.industryValue = event.detail.value;
    this.handleFilterChange();
  }

  handleFromDateChange(event) {
    this.fromDate = event.target.value;
    this.handleFilterChange();
  }

  handleToDateChange(event) {
    this.toDate = event.target.value;
    this.handleFilterChange();
  }

  handleFilterChange() {
    this.filtersToSend = this.defaultFilter;
    if (
      !(
        this.searchText == null ||
        this.searchText == "" ||
        this.searchText == undefined
      )
    ) {
      this.filtersToSend += " AND Name LIKE '%" + this.searchText + "%'";
    }
    if (
      !(
        this.industryValue == null ||
        this.industryValue == "" ||
        this.industryValue == undefined
      )
    ) {
      this.filtersToSend += ' AND Industry = \'' + this.industryValue + '\'';
    }
    if (
      !(
        this.fromDate == null ||
        this.fromDate == "" ||
        this.fromDate == undefined
      )
    ) {
      this.filtersToSend +=
        " AND CreatedDate  >= " + this.fromDate;
    }
    if (
      !(this.toDate == null || this.toDate == "" || this.toDate == undefined)
    ) {
      this.filtersToSend +=
        " AND CreatedDate <= " + this.toDate;
    }
  }

  handleSearch() {
    //console.log('handleSearch called');
    this.showTable = true;
    //console.log(this.filtersToSend);
    let child = this.template.querySelector("c-search-list-data-table-wrapper");
    console.log('child');
    console.log(child);
    child.doSearch();
  }
}