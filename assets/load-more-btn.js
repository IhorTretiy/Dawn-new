class CollectionGrid extends HTMLElement {
  constructor() {
    super();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('filterChange', () => {
      this.initializeComponents();
    });

    this.initializeComponents();
  }

  initializeComponents() {
    const urlParams = new URLSearchParams(window.location.search);

    this.productGrid = this.querySelector('#product-grid');
    this.productsWrapper = this.querySelector('[data-product-wrapper-js]');

    this.loadMoreButton = this.querySelector('#load-more-btn');
    this.loadMoreButtonText = this.loadMoreButton.querySelector('[data-button-text]');
    this.loadMoreButtonLoader = this.loadMoreButton.querySelector('.loading__spinner');

    this.loadPreviousButton = this.querySelector('#load-previous-btn');
    this.loadPreviousButtonText = this.loadPreviousButton?.querySelector('[data-button-text]');
    this.loadPreviousButtonLoader = this.loadPreviousButton?.querySelector('.loading__spinner');

    this.productsPerPage = Number(this.dataset.limit);
    this.totalProductsCount = Number(this.dataset.totalProductsQuantity);
    this.currentPage = urlParams.has('page') ? Number(urlParams.get('page')) + 1 : 2;
    this.displayedProductsCount = this.productGrid.children.length;

    this.loadedProductsCount = urlParams.has('page')
      ? Number(urlParams.get('page')) * this.displayedProductsCount
      : this.displayedProductsCount;

    this.isFetching = false;
    this.previousPage = Number(urlParams.get('page')) - 1;

    if (this.loadMoreButton) {
      this.loadMoreButton.addEventListener('click', this.loadNextProducts.bind(this));
    }

    if (this.loadPreviousButton) {
      this.loadPreviousButton.addEventListener('click', this.loadPreviousProducts.bind(this));
    }
  }

  async loadNextProducts() {
    if (this.isFetching || this.loadedProductsCount >= this.totalProductsCount) return;

    this.isFetching = true;
    this.updateLoadMoreButtonState();

    try {
      const newProducts = await this.fetchPage(this.currentPage);
      newProducts.forEach(product => this.productsWrapper.appendChild(product));
      this.loadedProductsCount += newProducts.length;
      this.currentPage += 1;
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      this.isFetching = false;
      this.updateLoadMoreButtonState();
    }
  }

  async loadPreviousProducts() {
    if (this.isFetching || this.previousPage < 1) return;

    this.isFetching = true;
    this.updateLoadPreviousButtonState();

    try {
      const previousProducts = await this.fetchPage(this.previousPage);
      previousProducts.reverse().forEach(product => this.productsWrapper.prepend(product));
      this.previousPage -= 1;
    } catch (error) {
      console.error('Failed to load previous products:', error);
    } finally {
      this.isFetching = false;
      this.updateLoadPreviousButtonState();
    }
  }

  async fetchPage(pageNumber) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('page');
    const queryString = urlParams.toString();
    const pageParam = `?page=${pageNumber}${queryString ? `&${queryString}` : ''}`;

    const response = await fetch(`/collections/${this.dataset.collectionHandle}${pageParam}`);
    if (!response.ok) {
      throw new Error(`Network error: ${response.statusText}`);
    }

    const responseText = await response.text();
    const parsedDocument = new DOMParser().parseFromString(responseText, 'text/html');
    const productElements = parsedDocument.querySelectorAll('[data-product-container-js]');

    if (pageNumber >= this.currentPage) {
      window.history.pushState({ path: response.url }, '', response.url);
    }

    return Array.from(productElements);
  }

  updateLoadMoreButtonState() {
    if (this.loadMoreButton) {
      this.loadMoreButtonText.classList.toggle('hidden', this.isFetching);
      this.loadMoreButtonLoader.classList.toggle('hidden', !this.isFetching);
      this.loadMoreButton.disabled = this.isFetching;
      this.loadMoreButton.classList.toggle('hidden', this.loadedProductsCount >= this.totalProductsCount);
    }
  }

  updateLoadPreviousButtonState() {
    if (this.loadPreviousButton) {
      this.loadPreviousButtonText.classList.toggle('hidden', this.isFetching);
      this.loadPreviousButtonLoader.classList.toggle('hidden', !this.isFetching);
      this.loadPreviousButton.disabled = this.isFetching;
      this.loadPreviousButton.classList.toggle('hidden', this.previousPage < 1);
    }
  }
}

customElements.define('collection-grid', CollectionGrid);
