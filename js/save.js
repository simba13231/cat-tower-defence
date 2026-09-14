/* =========================================================================
   save.js — persists best result across sessions via localStorage
   ========================================================================= */

function saveProgress(stars){
  const save = JSON.parse(localStorage.getItem('cvd_save')||'{}');
  save.bestStars = Math.max(save.bestStars||0, stars);
  save.timesWon = (save.timesWon||0)+1;
  localStorage.setItem('cvd_save', JSON.stringify(save));
}

function loadBestStars(){
  const save = JSON.parse(localStorage.getItem('cvd_save')||'{}');
  return save.bestStars||0;
}
