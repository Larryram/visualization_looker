looker.plugins.visualizations.add({
  // L'ID doit matcher parfaitement avec celui de votre manifest.lkml
  id: "radial_gauge_custom",
  label: "Gauge custom",
  options: {},

  // 1. Initialiser le conteneur HTML de la jauge
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

    // Protection : Une jauge a besoin d'au moins une Mesure (le chiffre clé)
    const measures = queryResponse.fields.measures;
    
    if (measures.length === 0) {
      this.addError({
        title: "Données insuffisantes", 
        message: "Cette jauge nécessite au moins une Mesure (ex: Chiffre d'affaires, Total...). Vous n'avez pas besoin de sélectionner de Dimension."
      });
      return done();
    }

    // Récupérer dynamiquement le nom technique et le label textuel de la mesure Looker
    const measureName = measures[0].name;
    const measureLabel = measures[0].label_short || measures[0].label;

    // Contrairement à un camembert, une jauge affiche UNE seule valeur globale. 
    // On extrait donc la valeur de la toute première ligne retournée par Looker (et 0 par défaut si vide).
    const gaugeValue = data[0] && data[0][measureName] ? Number(data[0][measureName].value) : 0;

    // 3. Rendu de VOTRE modèle Highcharts "Gauge"
    // Remplacement de 'container' par element.querySelector pour éviter les bugs sur les dashboards multi-tuiles
    Highcharts.chart(element.querySelector('#highcharts-gauge-container'), {
      chart: {
        type: 'gauge'
      },

      title: {
        text: measureLabel // Titre automatique basé sur le nom de votre mesure Looker
      },

      // Zone géométrique de la jauge (demi-cercle)
      pane: {
        startAngle: -90,
        endAngle: 90,
        background: null
      },

      // L'axe des valeurs avec vos zones de couleurs (Gris, Jaune, Vert)
      yAxis: {
        min: 0,
        max: 200000,
        plotBands: [
          {
            from: 0,
            to: 110000,
            color: 'rgba(128, 128, 128, 0.1)' // gray
          },
          {
            from: 111000,
            to: 149000,
            color: '#FFBF00' // yellow
          },
          {
            from: 150000,
            to: 200000,
            color: '#00A96B' // green
          }
        ]
      },

      series: [
        {
          name: measureLabel,
          data: [gaugeValue], // INJECTION DE LA DONNÉE LOOKER ICI (Remplace les 80000 en dur)
          tooltip: {
            valuePrefix: '$'
          },
          dataLabels: {
            format: '${y:,.0f}'
          }
        }
      ]
    });

    // 4. Toujours signaler à Looker que le rendu graphique est terminé
    done();
  }
});
