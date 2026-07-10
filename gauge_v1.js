looker.plugins.visualizations.add({
  id: "radial_gauge_custom",
  label: "Gauge custom",
  options: {},

  // 1. Initialiser le conteneur HTML
  create: function(element, config) {
    element.innerHTML = `
      <style>
        #highcharts-gauge-container {
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="highcharts-gauge-container"></div>
    `;
  },

  // 2. Récupérer la donnée Looker et injecter le graphique Highcharts
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    const measures = queryResponse.fields.measures;
    if (measures.length === 0) {
      this.addError({
        title: "Données insuffisantes", 
        message: "Cette jauge nécessite au moins une Mesure (ex: Taux d'intégration)."
      });
      return done();
    }

    const measureName = measures[0].name;
    const measureLabel = measures[0].label_short || measures[0].label;

    // Récupérer la valeur brute (ex: 0.4534)
    const rawValue = data[0] && data[0][measureName] ? Number(data[0][measureName].value) : 0;

    // 3. Rendu du modèle Highcharts avec échelle de 0 à 1 (représentant 0% à 100%)
    Highcharts.chart(element.querySelector('#highcharts-gauge-container'), {
      chart: {
        type: 'gauge'
      },

      title: {
        text: measureLabel
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: null
      },

      // L'AXE DES VALEURS AJUSTÉ DE 0 À 1
      yAxis: {
        min: 0,
        max: 1, // Échelle maximale à 1 (pour 100%)
        
        // Formatage des étiquettes de l'axe (ex: 0.55 devient 55%)
        labels: {
          formatter: function() {
            return (this.value * 100) + '%';
          }
        },
        
        // Seuils de couleurs proportionnels entre 0 et 1
        plotBands: [
          {
            from: 0,
            to: 0.55, // Équivaut à 55%
            color: 'rgba(128, 128, 128, 0.1)' // gray
          },
          {
            from: 0.555,
            to: 0.745, // Équivaut à 74.5%
            color: '#FFBF00' // yellow
          },
          {
            from: 0.75,
            to: 1, // Équivaut à 100%
            color: '#00A96B' // green
          }
        ]
      },

      series: [
        {
          name: measureLabel,
          data: [rawValue], // L'aiguille se placera correctement (ex: 0.4534)
          tooltip: {
            valueSuffix: '%'
          },
          // Formatage du texte sous l'aiguille (multiplié par 100 pour l'affichage textuel)
          dataLabels: {
            formatter: function() {
              return (this.y * 100).toFixed(2) + '%';
            }
          }
        }
      ]
    });

    done();
  }
});
