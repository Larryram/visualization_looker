looker.plugins.visualizations.add({
  id: "custom_highcharts_pie_dynamic", 
  label: "Pie Chart Custom",
  options: {},

  // 1. Initialiser le conteneur HTML du camembert
  create: function(element, config) {
    // FORCE LE CONTENEUR LOOKER À PRENDRE TOUTE LA PLACE
    element.style.height = "100%";
    element.style.width = "100%";

    element.innerHTML = `
      <style>
        .highcharts-pie-container {
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="highcharts-pie-container"></div>
    `;
  },

  // 2. Rendre les données dynamiques et injecter Highcharts
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // Protection : Vérifier qu'on a bien au moins 1 dimension et 1 mesure
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;

    if (!dimensions || dimensions.length === 0 || !measures || measures.length === 0) {
      this.addError({
        title: "Données insuffisantes",
        message: "Cette visualisation nécessite au moins une Dimension et une Mesure."
      });
      return done();
    }

    // Sécurité : Vérifier si Highcharts est bien chargé via le manifest
    if (typeof Highcharts === 'undefined') {
      this.addError({
        title: "Librairie manquante",
        message: "Highcharts n'a pas pu être chargé. Vérifiez la console (F12) pour un blocage CSP."
      });
      return done();
    }

    // Récupérer le nom technique des colonnes Looker
    const dimensionName = dimensions[0].name;
    const measureName = measures[0].name;
    const measureLabel = measures[0].label_short || measures[0].label;

    // 3. TRANSFORMATION SÉCURISÉE : On gère les valeurs nulles/indéfinies
    const highchartsData = data.map(row => {
      const dimLabel = row[dimensionName] && row[dimensionName].value !== null ? row[dimensionName].value : 'N/A';
      const measValue = row[measureName] && row[measureName].value !== null ? Number(row[measureName].value) : 0;
      
      return [dimLabel, measValue];
    });

    // Cible le conteneur via sa classe
    const chartContainer = element.querySelector('.highcharts-pie-container');

    // 4. Rendu de votre modèle Highcharts
    Highcharts.chart(chartContainer, {
      chart: {
        type: 'pie'
      },

      title: {
        text: 'Support requests'
      },

      colors: ['#014CE5', '#A5AFB6', '#D6DBDE', '#E8EEF1', '#F5FCFF'],

      tooltip: {
        valueSuffix: '%'
      },

      series: [
        {
          name: measureLabel,
          data: highchartsData, 
          
          dataLabels: [
            {
              enabled: true,
              format: '{point.name}',
              connectorColor: '#333'
            },
            {
              enabled: true,
              format: '{point.percentage:.0f}%',
              backgroundColor: 'contrast',
              distance: -30, 
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
