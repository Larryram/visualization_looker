looker.plugins.visualizations.add({
  // 1. Charger la dépendance Highcharts via CDN
  dependencies: [
   "https://cdnjs.cloudflare.com/ajax/libs/highcharts/11.4.1/highcharts.js"
  ],

  // 2. Initialiser le conteneur HTML
  create: function(element, config) {
    element.innerHTML = `
      <style>
        #highcharts-custom-pie {
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="highcharts-custom-pie"></div>
    `;
  },

  // 3. Mettre à jour le graphique avec les données de Looker
  updateAsync: function(data, element, config, queryResponse, details, done) {
    
    // Protection : Vérifier qu'on a bien au moins 1 dimension et 1 mesure
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;
    
    if (dimensions.length === 0 || measures.length === 0) {
      this.addError({
        title: "Données insuffisantes", 
        message: "Cette visualisation nécessite au moins une Dimension (ex: Canal) et une Mesure (ex: Volume)."
      });
      return done();
    } else {
      this.clearErrors();
    }

    // Récupérer le nom technique des champs Looker
    const dimensionName = dimensions[0].name;
    const measureName = measures[0].name;
    const measureLabel = measures[0].label_short || measures[0].label;

    // 4. Transformation des données Looker au format Highcharts [['Nom', Valeur], ...]
    const highchartsData = data.map(row => {
      return [
        row[dimensionName].value, // Ex: 'Webform', 'Call'...
        row[measureName].value    // Ex: 55, 17...
      ];
    });

    // 5. Rendu de VOTRE modèle Highcharts personnalisé
    Highcharts.chart(element.querySelector('#highcharts-custom-pie'), {
      chart: {
        type: 'pie'
      },

      title: {
        text: 'Support requests' // Votre titre en dur
      },

      // Vos couleurs spécifiques light/branding
      colors: ['#014CE5', '#A5AFB6', '#D6DBDE', '#E8EEF1', '#F5FCFF'],

      tooltip: {
        valueSuffix: '%' // Votre suffixe d'infobulle
      },

      series: [
        {
          name: measureLabel,
          data: highchartsData, // Vos données Looker injectées de manière dynamique
          dataLabels: [
            {
              // ÉTIQUETTES EXTÉRIEURES (Noms des catégories)
              enabled: true,
              format: '{point.name}',
              connectorColor: '#333'
            },
            {
              // ÉTIQUETTES INTÉRIEURES (Pourcentages)
              enabled: true,
              format: '{point.percentage:.0f}%',
              backgroundColor: 'contrast',
              distance: -30, // Place l'étiquette à l'intérieur de la part
              style: {
                fontSize: '0.9em',
                textOutline: 'none'
              }
            }
          ]
        }
      ]
    });

    // 6. Toujours signaler à Looker que le rendu est terminé
    done();
  }
});