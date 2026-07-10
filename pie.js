looker.plugins.visualizations.add({
  id: "custom_highcharts_pie_dynamic", // Pensez à aligner cet ID dans votre manifest.lkml
  label: "Pie Chart Custom",
  options: {},

  // 1. Initialiser le conteneur HTML du camembert
  create: function(element, config) {
    element.innerHTML = `
      <style>
        #highcharts-pie-container {
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="highcharts-pie-container"></div>
    `;
  },

  // 2. Rendre les données dynamiques et injecter Highcharts
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // Protection : Vérifier qu'on a bien au moins 1 dimension et 1 mesure dans l'Explore
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (dimensions.length === 0 || measures.length === 0) {
      this.addError({
        title: "Données insuffisantes",
        message: "Cette visualisation nécessite au moins une Dimension (ex: Canal de publication) et une Mesure."
      });
      return done();
    }

    // Récupérer le nom technique des colonnes Looker sélectionnées
    const dimensionName = dimensions[0].name;
    const measureName = measures[0].name;
    const measureLabel = measures[0].label_short || measures[0].label;

    // 3. TRANSFORMATION DYNAMIQUE : On transforme les lignes de l'Explore en [['Nom', Valeur], ...]
    const highchartsData = data.map(row => {
      return [
        row[dimensionName].value,         // Dynamique : ex 'Webform', 'Call'...
        Number(row[measureName].value)    // Dynamique : ex 55, 17...
      ];
    });

    // 4. Rendu de votre modèle Highcharts
    Highcharts.chart(element.querySelector('#highcharts-pie-container'), {
      chart: {
        type: 'pie'
      },

      title: {
        text: 'Support requests' // Votre titre en dur
      },

      // Application directe de vos couleurs spécifiques
      colors: ['#014CE5', '#A5AFB6', '#D6DBDE', '#E8EEF1', '#F5FCFF'],

      tooltip: {
        valueSuffix: '%'
      },

      series: [
        {
          name: measureLabel,
          data: highchartsData, // INJECTION DE VOS DONNÉES DYNAMIQUES LOOKER
          
          // Vos doubles étiquettes (Intérieures et Extérieures)
          dataLabels: [
            {
              // ÉTIQUETTES EXTÉRIEURES (Noms)
              enabled: true,
              format: '{point.name}',
              connectorColor: '#333'
            },
            {
              // ÉTIQUETTES INTÉRIEURES (Pourcentages)
              enabled: true,
              format: '{point.percentage:.0f}%',
              backgroundColor: 'contrast',
              distance: -30, // Positionné à l'intérieur de la part
              style: {
                fontSize: '0.9em',
                textOutline: 'none'
              }
            }
          ]
        }
      ]
    });

    // Toujours signaler à Looker que le graphique est prêt
    done();
  }
});
