import { Component, Prop, Element, Event, EventEmitter, Watch, Method, State } from '@stencil/core';

import GestureDetector from './pdf-viewer-assets/gestures.js';

@Component({
    tag: 'hive-pdf-viewer',
    styleUrl: 'pdf-viewer.scss',
    shadow: true,
    assetsDir: 'pdf-viewer-assets'
})
export class PdfViewer {

    /**
     * Own properties.
     */
    static CSSVariables = [
        '--pdf-viewer-top-offset',
        '--pdf-viewer-bottom-offset'
    ];
    gestures: GestureDetector;
    iframeEl: HTMLIFrameElement;
    searchToggleEl: HTMLElement;
    sidebarToggleEl: HTMLElement;
    toolbarEl: HTMLElement;
    viewerContainer: HTMLElement;
    zoomIn: HTMLElement;
    zoomOut: HTMLElement;

    /**
     * Reference to host HTML element.
     */
    @Element() element: HTMLElement;

    /**
     * State variables.
     */
    @State() iframeLoaded: boolean;
    @State() sidebarVisible: boolean;

    /**
     * Public Property API.
     */
    @Prop() page: number;
    @Prop({ context: 'resourcesUrl' }) resourcesUrl: string;
    @Prop() src: string;
    @Prop({ context: 'window' }) window: Window;

    // Property lifecycle events.
    @Prop() enableToolbar = true;

    @Watch('enableToolbar')
    updateToolbarVisibility() {
        if (this.toolbarEl) {
            if (this.enableToolbar) {
                this.toolbarEl.classList.remove('hidden');
            }
            else {
                this.toolbarEl.classList.add('hidden');
                this.iframeEl.contentDocument.documentElement.style.setProperty('--toolbar-height', '0px');
            }
        }
    }

    @Prop() disableScrolling = false;

    @Watch('disableScrolling')
    updateScrolling() {
        if (this.viewerContainer) {
            if (this.disableScrolling) {
                this.viewerContainer.style.overflow = 'hidden';
                this.viewerContainer.style.position = 'fixed';
            }
            else {
                this.viewerContainer.style.overflow = 'auto';
                this.viewerContainer.style.position = 'absolute';
            }
        }
    }

    @Prop() enableSideDrawer = true;

    @Watch('enableSideDrawer')
    updateSideDrawerVisibility() {
        if (this.sidebarToggleEl) {
            if (this.enableSideDrawer) {
                this.sidebarToggleEl.classList.remove('hidden');
            }
            else {
                this.sidebarToggleEl.classList.add('hidden');
            }
        }
    }

    @Prop() enableSearch = true;

    @Watch('enableSearch')
    updateSearchVisibility() {
        if (this.searchToggleEl) {
            if (this.enableSearch) {
                this.searchToggleEl.classList.remove('hidden');
            }
            else {
                this.searchToggleEl.classList.add('hidden');
            }
        }
    }

    @Prop() scale: 'auto' | 'page-fit' | 'page-width' | number;

    @Watch('scale')
    updateScale() {
        this.setScale(this.scale);
    }

    @Prop() enableSwipe = true;

    @Watch('enableSwipe')
    enableSwipeChanged() {
        if (this.gestures) {
            if (this.enableSwipe) {
                this.gestures.on('swipeleft', this.handleSwipeLeft.bind(this));
                this.gestures.on('swiperight', this.handleSwipeRight.bind(this));
            } else {
                this.gestures.off('swipeleft', this.handleSwipeLeft.bind(this));
                this.gestures.off('swiperight', this.handleSwipeRight.bind(this));
            }
        }
    }

    @Prop() enablePinch = true;

    @Watch('enablePinch')
    enablePinchChanged() {
        if (this.gestures) {
            if (this.enablePinch) {
                this.gestures.on('pinchin', this.handlePinchIn.bind(this));
                this.gestures.on('pinchout', this.handlePinchOut.bind(this));
            } else {
                this.gestures.off('pinchin', this.handlePinchIn.bind(this));
                this.gestures.off('pinchout', this.handlePinchOut.bind(this));
            }
        }
    }

    /**
     * Events section
     */
    @Event() onLinkClick: EventEmitter<string>;
    @Event() pageChange: EventEmitter<number>;
    @Event() selectedText: EventEmitter<Selection>;

    /**
     * Lifecycle events section.
     */
    componentDidLoad() {
        this.iframeEl.onload = () => {
            this.setCSSVariables();
            this.init();
            this.addEventListeners();
            this.iframeLoaded = true;
        }
    }

    /**
     * Listeners.
     */
    // In this case, events come from iframe. See addEventListeners() method.

    /**
     * Public methods API.
     */
    @Method()
    print() {
        return new Promise<void>((resolve) => {
            this.iframeEl.contentWindow.print();
            this.iframeEl.contentWindow.addEventListener('afterprint', () => {
                resolve();
            }, { once: true })
        })
    }

    @Method()
    setScale(scale: 'auto' | 'page-fit' | 'page-width' | number) {
        const contentWindow = (this.iframeEl.contentWindow as any);

        if (contentWindow && contentWindow.PDFViewerApplication) {
            const { pdfViewer } = (this.iframeEl.contentWindow as any).PDFViewerApplication;
            pdfViewer.currentScaleValue = scale;
        }
    }

    @Method()
    clearSelection() {
        const document = this.iframeEl.contentDocument;
        if (document && document.getSelection()) {
            document.getSelection().removeAllRanges();
        }
    }

    /**
     * Local methods.
     */
    get viewerSrc() {
        if (this.page) {
            return `${this.resourcesUrl}pdf-viewer-assets/viewer/web/viewer.html?file=${encodeURIComponent(this.src)}#page=${this.page}`;
        }
        return `${this.resourcesUrl}pdf-viewer-assets/viewer/web/viewer.html?file=${encodeURIComponent(this.src)}`;
    }

    setCSSVariables() {
        for (let i = 0; i < PdfViewer.CSSVariables.length; i++) {
            const value = getComputedStyle(this.element).getPropertyValue(PdfViewer.CSSVariables[i]);
            this.iframeEl.contentDocument.documentElement.style.setProperty(PdfViewer.CSSVariables[i], value);
        }
    }

    init() {
        const documentBody = this.iframeEl.contentDocument.body;
        this.viewerContainer = documentBody.querySelector('#viewerContainer');
        this.toolbarEl = documentBody.querySelector('#toolbarContainer');
        this.sidebarToggleEl = documentBody.querySelector('#sidebarToggle');
        this.searchToggleEl = documentBody.querySelector('#viewFind');
        this.zoomIn = documentBody.querySelector('#zoomIn');
        this.zoomOut = documentBody.querySelector('#zoomOut');
        this.gestures = new GestureDetector(this.viewerContainer);
        this.updateToolbarVisibility();
        this.updateSideDrawerVisibility();
        this.updateSearchVisibility();
        this.updateScrolling();
        this.enableSwipeChanged();
        this.enablePinchChanged();
    }

    addEventListeners() {
        this.viewerContainer.addEventListener('pagechange', this.handlePageChange.bind(this));
        this.viewerContainer.addEventListener('click', this.handleLinkClick.bind(this));
        this.viewerContainer.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.iframeEl.contentDocument.addEventListener('selectionchange', () => {});
        // Workaround to support text selection on mobile devices
        this.viewerContainer.addEventListener('contextmenu', this.handleMouseUp.bind(this));

        // when the documents within the pdf viewer finish loading
        this.iframeEl.contentDocument.addEventListener('pagesloaded', () => {
            if (this.scale) {
                this.setScale(this.scale);
            }
        });

        // Controls the sidebar status to support a coherent swipe behaviour
        this.sidebarToggleEl.addEventListener('click', () => {
            this.sidebarVisible = !this.sidebarVisible;
        })
    }

    handlePageChange(e: any) {
        this.pageChange.emit(e.pageNumber);
    }

    handleLinkClick(e: any) {
        e.preventDefault();
        const link = (e.target as any).closest('.linkAnnotation > a');
        if (link) {
            // Ignore internal links to the same document
            if (link.classList.contains('internalLink')) {
                return;
            }
            const href = (e.target as any).closest('.linkAnnotation > a').href || '';
            this.onLinkClick.emit(href);
        }
    }

    handleMouseUp() {
        // Hide side drawer if it is visible
        this.handleSwipeRight();

        // Manage selection
        const selection = this.iframeEl.contentDocument.getSelection();
        // If the selection is empty then there's no new selection event to emit.
        if (!selection.rangeCount || !selection.toString()) {
            return;
        }
        this.selectedText.emit(selection);
    }

    handleSwipeLeft() {
        if (this.sidebarToggleEl && this.enableSideDrawer) {
            this.sidebarToggleEl.click();
        }
    }

    handleSwipeRight() {
        if (this.sidebarVisible) {
            this.handleSwipeLeft();
        }
    }

    handlePinchIn() {
        this.zoomOut.click();
    }

    handlePinchOut() {
        this.zoomIn.click();
    }

    /**
     * render() function.
     */
    render() {
        return <iframe class={this.iframeLoaded ? 'loaded' : ''} ref={(el) => this.iframeEl = el as HTMLIFrameElement} src={this.viewerSrc}></iframe>;
    }
}
