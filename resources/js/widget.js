(function(){
    var template=`
        <v-app toolbar fill-height :dark="dark" :light="!dark">
            <v-toolbar dense ref="ocdsearch">
                <v-toolbar-title class="mr-2" :class="colorClass">OCDsearch</v-toolbar-title>
                <v-text-field v-model="query" label="" style="margin-top:10px"></v-text-field>
                <v-btn icon v-if="!message">
                    <v-icon @click="searchInputFocus">search</v-icon>
                </v-btn>
                <v-btn icon v-if="message">
                    <v-progress-circular indeterminate :class="colorClass"></v-progress-circular>
                </v-btn>
            </v-toolbar>

            <main>
                <v-layout row wrap>
                    <v-flex xs12 md3 :class="filterToggle" v-observe-visibility="filterToggleVisible">
                        <v-container fluid grid-list-lg>
                            <div v-for="(name, s) in statuses">
                                <v-checkbox :label="name" :value="s" :class="colorClass" v-model="status" hide-details></v-checkbox>
                            </div>
                        </v-container>
                    </v-flex>
                    <v-flex xs12 hidden-md-and-up class="ml-3 mr-3 mt-3">
                        <v-btn outline block @click.prevent="toggleFilter">{{ filterButtonTitle }}</v-btn>
                    </v-flex>
                    <v-flex xs12 md9>
                        <v-container fluid grid-list-lg>
                            <v-layout row wrap v-if="!tender">
                                <v-flex xs12>
                                    <div v-if="totalResults!==null">
                                        <div class="headline">
                                            Total: {{ totalResults }}
                                        </div>
                                        <div v-if="totalResults==0">
                                            no results found
                                        </div>
                                    </div>
                                </v-flex>
                                <v-flex xs12 v-for="item in results" :key="item.id">
                                    <v-card hover tile>
                                        <v-card-title @click.prevent="tenderOpen(item.tenderID)">
                                            <v-flex xs6 class="grey--text">{{ item.tenderID }}</v-flex>
                                            <v-flex xs6 class="text-xs-right">{{ formatedAmount(item.value.amount) }} {{ item.value.currency }}</v-flex>
                                            <v-flex xs12 class="headline" :class="colorClass">{{ item.title }}</v-flex>
                                            <v-flex xs12 class="caption">{{ procuringEntityName(item) }}</v-flex>
                                            <v-flex xs12>{{ formattedStatus(item.status) }}</v-flex>
                                        </v-card-title>
                                    </v-card>
                                </v-flex>
                                <v-flex xs12 v-if="totalPages>1" class="text-xs-center">
                                    <v-pagination v-bind:length.number="totalPages" v-model="currentPage" circle></v-pagination>
                                </v-flex>
                            </v-layout>
                            <v-layout row wrap v-if="tender">
                                <v-flex xs12>
                                    <v-btn flat :class="colorClass" @click.prevent="tenderClose">Back to search results</v-btn>
                                </v-flex>
                                <v-flex xs12>
                                    <v-card tile>
                                        <v-card-title>
                                            <v-flex xs12>{{ tender.tenderID }}</v-flex>
                                            <v-flex xs12 class="headline" :class="colorClass">{{ tender.title }}</v-flex>
                                            <v-flex xs12>{{ formatedAmount(tender.value.amount) }} {{ tender.value.currency }}</v-flex>
                                            <v-flex xs12>{{ procuringEntityName(tender) }}</v-flex>
                                            <v-flex xs12>{{ formattedStatus(tender.status) }}</v-flex>
                                        </v-card-title>
                                    </v-card>
                                </v-flex>
                            </v-layout>
                            <v-layout row wrap v-if="!tender && totalResults===null && mounted">
                                <v-flex xs12>
                                    Please, specify query
                                </v-flex>
                            </v-layout>
                        </v-container>
                    </v-flex>
                </v-layout>
            </main>
        </v-app>
    `;

    Vue.component('ocdsearch', {
        props: [
            'apiKey',
            'theme',
            'color',
            'host'
        ],
        data: function(){
            return {
                status: [
                    'active'
                ],
                query: '',
                dark: (this.theme=='dark'),

                results: [],
                tender: null,

                queryKey: null,
                totalResults: null,
                totalPages: 0,
                currentPage: 1,
                onPage: 10,

                message: null,
                drawer: true,
                statuses: {
                    "active": "Active",
                    "cancelled": "Сancelled",
                    "complete": "Сomplete",
                    "planned": "Planned",
                    "unsuccessful": "Unsuccessful"
                },
                mounted: false,
                isFilterVisible: true,
                filterButtonTitle: ''
            };
        },
        template: template,
        computed: {
            colorClass: function() {
                var classes={};

                classes[this.color+'--text']=true;

                return classes;
            },
            filterToggle: function(){
                return {
                    'hidden-sm-and-down': this.isFilterVisible
                }
            }
        },
        watch: {
            query: function() {
                this.search();
            },
            status: function() {
                this.search();
            },
            currentPage: function(){
                this.search();
            }
        },
        created: function () {
            this.search();
        },
        methods: {
            search: _.debounce(
                function () {
                    var _this = this;

                    if(this.query!='' || this.status.length>0) {
                        if(this.queryKey!=this.query+this.status) {
                            this.currentPage=1;
                        }

                        this.queryKey=this.query+this.status;

                        this.message='loading...';
                        this.tender=null;

                        this.$nextTick(function(){
                            var offset=this.cumulativeOffset(this.$refs.ocdsearch.$el);

                            if(this.mounted) {
                                document.body.scrollTop=offset.top-20;
                            }
            			});

                        axios.post(this.host, {
                            query: this.query,
                            status: this.status,
                            api: this.apiKey,
                            start: (this.currentPage-1)*this.onPage
                        })
                        .then(function (response) {
                            _this.message=null;
                            _this.results=response.data.items;
                            _this.totalResults=numeral(response.data.total).format('0,0').replace(/,/g, ' ');
                            _this.mounted=true;

                            _this.totalPages=Math.ceil(response.data.total/_this.onPage);
                        })
                        .catch(function (error) {
                            _this.message = 'Error! Could not reach the API. ' + error;
                        });
                    } else {
                        this.results=[];
                        this.totalResults=null;
                        this.message=null;
                        this.totalPages=0;
                        this.currentPage=1;
                        this.tender=null;
                    }
                },
                300
            ),
            tenderOpen: function(tenderID) {
                var _this = this;

                this.message='loading...';

                this.$nextTick(function(){
                    var offset=this.cumulativeOffset(this.$refs.ocdsearch.$el);

                    document.body.scrollTop=offset.top-20;
    			});

                axios.post(this.host, {
                    tid: tenderID,
                    api: this.apiKey,
                })
                .then(function (response) {
                    _this.message=null;
                    _this.tender=response.data.items[0];
                })
                .catch(function (error) {
                    _this.message = 'Error! Could not reach the API. ' + error;
                });
            },
            tenderClose: function() {
                this.tender=null;
            },
            searchInputFocus: function(){

            },
            formatedAmount: function(amount) {
                return numeral(amount).format('0,0[,]00').replace(/,/g, ' ');
            },
            formattedStatus: function(status) {
                return this.statuses[status];
            },
            procuringEntityName: function(item) {
                if (item.procuringEntity && item.procuringEntity.name)
                    return item.procuringEntity.name;
                if (item.buyer && item.buyer.name)
                    return item.buyer.name;

                return "notset";
            },
            cumulativeOffset: function(element) {
                var top = 0, left = 0;
                do {
                    top += element.offsetTop  || 0;
                    left += element.offsetLeft || 0;
                    element = element.offsetParent;
                } while(element);

                return {
                    top: top,
                    left: left
                };
            },
            toggleFilter: function(){
                this.isFilterVisible=!this.isFilterVisible;
            },
            filterToggleVisible: function(isVisible){
                this.filterButtonTitle=(isVisible ? 'Close filters': 'Open filters');
            }
        }
    });

    /*
    var link,
        script=document.getElementById("ocdsearch-script"),
        a=document.createElement("a"),
        links=[],
        documentStyleSheets = document.styleSheets;

    a.href=script.src;

    links=[
        '//'+a.hostname+(a.port?':'+a.port:'')+'/build/css/app.css',
        '//fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons',
    ]

    for(var i=0;i<links.length;i++) {
        for (var s = 0; s < documentStyleSheets.length; s++) {
            if (documentStyleSheets[s].href && documentStyleSheets[s].href.indexOf(links[i])>=0){
                continue;
            }
        }

        link=document.createElement('link');

        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = links[i];

        document.head.appendChild(link);
    }
    */

    Vue.directive('observe-visibility', VueObserveVisibility.ObserveVisibility);

    var app = new Vue({
        el: '#ocdsearch',
    });
})();
