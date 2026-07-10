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

      yAxis: {
        min: 0,
        max: 1, // Échelle maximale à 1 (pour 100%)
        
        // Graduations de l'axe en %
        labels: {
          formatter: function() {
            return (this.value * 100) + '%';
          }
        },
        
        // Zones de couleurs (Gris, Jaune, Vert)
        plotBands: [
          {
            from: 0,
            to: 0.55,
            color: 'rgba(128, 128, 128, 0.1)'
          },
          {
            from: 0.555,
            to: 0.745,
            color: '#FFBF00'
          },
          {
            from: 0.75,
            to: 1,
            color: '#00A96B'
          }
        ]
      },

      series: [
        {
          name: measureLabel,
          data: [rawValue], // Position de l'aiguille (ex: 0.4534)
          
          // CORRECTION DU TOOLTIP (Infobulle au survol)
          tooltip: {
            formatter: function() {
              return this.series.name + ': <b>' + (this.y * 100).toFixed(2) + '%</b>';
            }
          },
          
          // CORRECTION DU TEXTE CENTRAL (Sous l'aiguille)
          dataLabels: {
            borderWidth: 0,
            style: {
              fontSize: '18px'
            },
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
