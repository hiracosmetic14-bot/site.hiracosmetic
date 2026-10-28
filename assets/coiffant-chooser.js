(() => {
 'use strict';
 const form = document.getElementById('coiffant-chooser');
 if (!form) return;
 const result = document.getElementById('chooser-result');
 const families = {
  powder: ['Explorez les poudres coiffantes', 'Votre priorité est le volume et la texture, avec une orientation vers un rendu mat.', '/categories/poudres-coiffantes.html', 'Voir les poudres'],
  wax: ['Explorez les cires et crèmes', 'Votre recherche de forme ou de souplesse vous oriente vers les cires et crèmes, dont les textures et les finitions varient.', '/categories/cires-et-cremes-coiffantes.html', 'Voir les cires et crèmes'],
  gel: ['Explorez les gels coiffants', 'Votre priorité est de structurer une coiffure fixée. Comparez les gels selon leur tenue et leur finition.', '/categories/gels-coiffants.html', 'Voir les gels']
 };
 const finishLabels = {mat:'finition mate',shine:'finition brillante',any:'finition à comparer'};
 const holdLabels = {flexible:'tenue souple',strong:'tenue forte',any:'tenue à comparer'};
 form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const answers = new FormData(form);
  const goal = answers.get('goal'), finish = answers.get('finish'), hold = answers.get('hold');
  let key = goal === 'texture' ? 'powder' : goal === 'fixed' ? 'gel' : 'wax';
  if (finish === 'shine' && goal === 'texture') key = 'wax';
  if (hold === 'flexible' && goal === 'fixed') key = 'wax';
  const family = families[key];
  document.getElementById('result-title').textContent = family[0];
  document.getElementById('result-reason').textContent = family[1];
  document.getElementById('result-preferences').textContent = 'Vos critères : '+finishLabels[finish]+' · '+holdLabels[hold]+'.';
  let note = 'Les caractéristiques dépendent du produit choisi ; cette orientation ne garantit pas le résultat sur vos cheveux.';
  if (goal === 'texture' && finish === 'shine') note = 'Vous recherchez du volume avec de la brillance : comparez les cires et crèmes à finition brillante. Une poudre à effet mat ne correspondrait pas à votre préférence de finition.';
  else if (goal === 'fixed' && hold === 'flexible') note = 'Vous souhaitez structurer tout en gardant de la souplesse : commencez par comparer les cires et crèmes plutôt que de rechercher une fixation rigide.';
  else if (key === 'gel' && finish === 'mat') note = 'Une finition mate ne peut pas être déduite du mot « gel ». Vérifiez explicitement ce rendu sur la fiche ; comparez aussi les cires mates dans le guide ci-dessous.';
  else if (key === 'powder' && hold === 'strong') note = 'Votre préférence de tenue forte doit être vérifiée sur la fiche : une poudre texturisante ne garantit pas à elle seule une fixation forte.';
  document.getElementById('result-caveat').textContent = note;
  const link = document.getElementById('result-link'); link.href = family[2]; link.textContent = family[3];
  result.hidden = false; result.focus();
 });
 form.addEventListener('change', () => { result.hidden = true; });
 form.addEventListener('reset', () => { result.hidden = true; form.querySelector('input').focus(); });
})();