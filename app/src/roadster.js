// An original, entirely procedural illustration. No images, fonts, or external assets.
function drawRoadster() {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 760;
  const c = canvas.getContext('2d');
  const ink = '#211b38';
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const path = (d, fill, stroke = ink, width = 3) => {
    const p = new Path2D(d);
    if (fill) { c.fillStyle = fill; c.fill(p); }
    if (stroke && width) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
  };
  const poly = (points, fill, stroke = ink, width = 3) => {
    c.beginPath();
    points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
    c.closePath(); c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  };
  const line = (x,y,x2,y2,color,width=2) => {
    c.beginPath(); c.moveTo(x,y); c.lineTo(x2,y2); c.strokeStyle=color; c.lineWidth=width; c.stroke();
  };
  const ellipse = (x,y,rx,ry,fill,stroke=null,width=2) => {
    c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fillStyle=fill; c.fill();
    if(stroke) {c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  };
  const grad = c.createLinearGradient(0,0,0,650);
  grad.addColorStop(0,'#5b345b'); grad.addColorStop(.32,'#e46d69');
  grad.addColorStop(.65,'#ffbb6d'); grad.addColorStop(1,'#f8d18a');
  c.fillStyle=grad; c.fillRect(0,0,1000,760);

  // Wide, broken sun bands give the skyline its screen-printed rhythm.
  ellipse(566,247,157,157,'#ffe3a0');
  for (let i=0;i<8;i++) {
    const y=260+i*17;
    c.save(); c.beginPath(); c.ellipse(566,247,157,157,0,0,Math.PI*2); c.clip();
    c.fillStyle=i<3?'#f49c74':'#ed8b72'; c.fillRect(392,y,348,3+i); c.restore();
  }
  path('M0 141 Q140 123 252 144 T461 140 M708 112 Q824 100 1000 125',null,'#ffc18a',3);
  path('M42 185 Q143 176 239 184 M756 168 Q864 161 941 178',null,'#f9aa81',2);
  path('M36 238 Q182 227 300 245 M770 235 Q876 230 1000 244',null,'#e88378',2);
  // Distant islands, sea and architectural silhouettes.
  path('M0 360 Q68 341 120 353 L163 338 199 351 253 337 300 347 332 334 375 350 419 344 466 355 525 344 582 361 668 343 739 354 800 343 855 352 920 340 1000 356 L1000 428 0 428Z','#b76f7c',null);
  c.fillStyle='#b57b85';c.fillRect(0,383,1000,57);
  for(let i=0;i<17;i++) line(20+i*73,398+(i%3)*12,93+i*73,398+(i%3)*12,'#e9a88d',1.5);
  // Ocean-drive buildings: asymmetry, roof fins, terraces and striped awnings.
  poly([[33,345],[33,265],[158,265],[158,245],[174,245],[174,371]],'#dc9a98','#8b596d',2);
  poly([[42,265],[42,251],[127,251],[127,265]],'#f3b3a0','#8b596d',2);
  for(let y=279;y<348;y+=20) for(let x=48;x<145;x+=23) poly([[x,y],[x+13,y],[x+13,y+10],[x,y+10]],'#81596d',null);
  poly([[187,366],[187,302],[208,302],[208,287],[299,287],[299,369]],'#f3b59f','#975f75',2);
  c.fillStyle='#a46d80';c.fillRect(222,298,63,7);
  for(let y=313;y<358;y+=16) line(215,y,285,y,'#a46d80',5);
  poly([[747,371],[747,272],[775,272],[775,236],[852,236],[852,371]],'#c17b86','#8b596d',2);
  poly([[777,236],[782,216],[845,216],[850,236]],'#e7a08f','#8b596d',2);
  for(let y=251;y<356;y+=19) {line(785,y,838,y,'#8c6178',6);line(751,y+20,769,y+20,'#8c6178',4);}
  poly([[871,380],[871,304],[979,304],[979,285],[993,285],[993,381]],'#edab94','#975f75',2);
  for(let x=882;x<974;x+=22) {c.fillStyle='#92677b';c.fillRect(x,319,12,24);}
  line(869,352,1000,352,'#805571',5);
  // A little roadside hotel sign, all lettering drawn with built-in canvas text.
  poly([[228,266],[228,198],[269,190],[269,266]],'#b74f68','#6c3c5d',2);
  c.save();c.translate(249,205);c.rotate(-.05);c.fillStyle='#ffdba2';c.font='bold 10px sans-serif';c.textAlign='center';
  'SOL'.split('').forEach((v,i)=>c.fillText(v,0,i*17));c.restore();

  // Palms have individual jagged fronds instead of simple starburst leaves.
  function palm(x,y,s,lean=0) {
    c.save();c.translate(x,y);c.scale(s,s);
    path(`M-8 0 Q${-12+lean} -130 ${lean} -263 L${lean+9} -263 Q${5+lean} -123 9 0Z`,'#342b47','#342b47',2);
    for(let i=0;i<12;i++) line(-7+lean*i/12,-i*21,8+lean*i/12,-i*21-4,'#8d5965',2);
    c.translate(lean+3,-264);
    const fronds=[[-105,-37,-150,-8],[-81,-80,-137,-67],[-36,-91,-61,-113],[40,-98,82,-92],[100,-62,145,-41],[109,-8,152,28],[58,7,89,82],[-52,10,-96,69]];
    fronds.forEach(([a,b,dx,dy])=>{
      path(`M0 0 Q${a} ${b} ${dx} ${dy} Q${a*.84} ${b+19} 0 0Z`,'#30283f',null);
      for(let i=2;i<9;i++) {
        const t=i/10, xx=2*(1-t)*t*a+t*t*dx, yy=2*(1-t)*t*b+t*t*dy;
        line(xx,yy,xx-dx*.095,yy+13+Math.abs(dx)*.04,'#30283f',3.5);
      }
      path(`M1 0 Q${a} ${b} ${dx} ${dy}`,null,'#9b6969',1);
    });
    ellipse(0,2,7,8,'#624359');c.restore();
  }
  palm(84,428,1.12,25); palm(946,413,1.18,-19);palm(335,391,.48,12);palm(705,386,.43,-10);
  // Promenade, curb and receding road.
  poly([[0,423],[1000,406],[1000,760],[0,760]],'#625367',null);
  poly([[0,421],[1000,402],[1000,431],[0,460]],'#e0a388',null);
  line(0,449,1000,423,'#332e49',5);
  for(let x=-150;x<1200;x+=110) line(x,447,x+60,425,'#ba7d7e',2);
  poly([[0,641],[171,594],[201,598],[0,669]],'#f5c98e',null);
  poly([[824,472],[1000,430],[1000,440],[835,479]],'#edbd8e',null);
  poly([[709,708],[1000,592],[1000,612],[733,735]],'#e7ad85',null);
  // Asphalt chips and directional marks; fixed deterministic coordinates.
  for(let i=0;i<110;i++) {
    const x=(i*137.71)%1000,y=456+(i*59.37)%304;
    line(x,y,x+3+(i%5)*2,y-1,'rgba(247,193,156,.17)',1);
  }
  ellipse(516,626,393,72,'rgba(25,22,42,.38)');
  ellipse(506,642,305,34,'rgba(25,22,42,.34)');

  // Rear wheel, partly hidden by the swept tail.
  c.save();c.translate(851,491);c.rotate(.18);
  ellipse(0,0,43,62,'#171a2a','#151829',5);ellipse(5,-1,29,46,'#6b6474','#b2a19d',3);
  ellipse(7,-2,21,35,'#242838','#c7b3a1',2);
  for(let a=0;a<Math.PI*2;a+=Math.PI/5) line(7,-2,7+Math.cos(a)*20,-2+Math.sin(a)*33,'#bdab9f',5);
  ellipse(7,-2,7,11,'#e9c39c','#282a39',2);c.restore();
  // Cabin silhouette and rear deck.
  path('M349 405 L440 319 Q453 302 480 300 L654 297 Q687 297 710 319 L807 393 L887 399 Q912 405 917 427 L869 475 514 566 143 503Z','#9d384e',ink,5);
  path('M430 383 L469 320 Q476 314 491 314 L642 312 Q663 313 678 327 L741 384 556 433Z','#262c45',ink,4);
  // Windshield, glowing reflection and narrow chrome surround.
  poly([[448,378],[482,324],[621,322],[665,397],[548,426]],'#53747f','#f7c198',4);
  poly([[489,327],[614,326],[651,389],[549,412],[461,376]],'#69838b',null);
  poly([[490,328],[512,327],[476,382],[463,377]],'#e9d8b1',null);
  poly([[528,327],[555,326],[507,395],[488,388]],'#c4c2a5',null);
  poly([[567,326],[615,326],[649,389],[573,407]],'#364e65',null);
  path('M485 382 Q531 361 579 378 L596 403 547 416Z','#262c43',null);
  path('M531 394 Q554 365 576 390',null,'#161e33',6);
  poly([[640,320],[666,328],[736,382],[684,395]],'#26374b','#e8ad8f',3);
  poly([[652,331],[664,335],[720,378],[684,385]],'#739096',null);
  line(664,333,684,387,'#b8aba1',2);
  path('M454 313 Q461 303 486 304 L650 302 Q671 302 688 317 L674 324 647 314 481 317Z','#ffd0a1',ink,2);
  // Seats are visible through side glass.
  path('M689 372 Q683 348 699 350 L726 375 718 383Z','#8d4d54',null);
  path('M744 384 L783 393 765 400 692 410 683 397Z','#ef8e77',ink,2);

  // Hood, front valance and flowing side body.
  const hood=c.createLinearGradient(280,384,500,548);
  hood.addColorStop(0,'#ffd099');hood.addColorStop(.24,'#f7aa7d');hood.addColorStop(.64,'#ed725e');hood.addColorStop(1,'#b64050');
  path('M160 473 Q224 430 355 400 L447 378 548 427 782 393 Q831 391 890 405 L898 425 536 555 139 508 Q136 489 160 473Z',hood,ink,5);
  path('M535 547 L898 421 897 466 Q894 479 891 484 L884 513 879 521 Q884 459 853 449 Q817 444 801 508 L791 552 713 585 Q711 529 670 526 Q620 525 605 607 L543 636Z','#b44354',ink,5);
  path('M553 556 L889 437 887 452 712 519 601 570Z','#f3836b',null);
  path('M715 572 L786 544 800 495 Q801 480 812 465 L789 528 710 559Z','#6f3047',null);
  path('M716 582 L784 556',null,'#f8b18a',3);
  path('M606 609 L555 626 553 613 607 592Z','#fbc291',ink,2);
  // Hood creases and reflections describe its long convex shape.
  path('M174 475 Q296 437 439 398 L521 441 778 411',null,'#ffe0ab',4);
  path('M205 480 Q322 455 450 416 L518 450 676 432 527 482Z','#ffc08d',null);
  path('M242 489 L452 440 494 454 321 500Z','#f99373',null);
  path('M164 490 Q328 497 525 535 L861 417',null,'#7d3248',3);
  path('M282 468 L433 425 M296 474 L447 431',null,'#a44a53',2);
  // Pair of hood vents, each with inset louvers.
  poly([[357,449],[424,430],[446,439],[376,460]],'#75384b','#d47768',2);
  for(let i=0;i<7;i++) line(367+i*9,449-i*2.4,380+i*9,455-i*2.4,'#e29378',2);
  poly([[459,474],[518,457],[543,464],[482,484]],'#75384b','#d47768',2);
  for(let i=0;i<6;i++) line(470+i*9,474-i*2.5,484+i*9,479-i*2.5,'#e29378',2);
  // Panel seams and polished door handle.
  path('M758 448 Q764 466 748 497 L729 551 710 558',null,'#652d45',2);
  path('M579 513 L586 548',null,'#7e3348',2);
  path('M740 457 L769 447 776 452 745 464Z','#f7c9a0',ink,2);
  line(745,458,768,451,'#fff0bc',2);
  path('M571 429 L584 411 Q588 407 600 408 L619 415 606 431 586 438Z','#e98a75',ink,3);
  path('M584 413 L600 412 611 417 600 424 583 428Z','#b3b1a0',ink,2);
  line(583,435,573,450,ink,4);

  // Near front wheel: wide tire, angled alloy spokes, stepped chrome rim.
  c.save(); c.translate(657,594);c.rotate(.22);
  ellipse(0,0,53,77,'#171a29',ink,5);
  path('M-13 -71 Q-57 -59 -54 3 Q-52 57 -15 73 L-24 58 Q-45 26 -38 -16 Q-33 -51 -13 -71Z','#2e2d3e',null);
  for(let i=-3;i<=3;i++) line(-47+i*.7,i*15,-39+i*.6,i*15+5,'#48404c',2);
  ellipse(6,-1,39,61,'#c2aba2','#3b3547',3);
  ellipse(7,-1,32,53,'#343849','#f5d2af',3);
  ellipse(7,-1,25,43,'#1d2636','#746d7a',2);
  for(let a=0;a<Math.PI*2;a+=Math.PI/5) {
    poly([[7+Math.cos(a-.19)*9,-1+Math.sin(a-.19)*14],[7+Math.cos(a-.1)*31,-1+Math.sin(a-.1)*51],[7+Math.cos(a+.13)*31,-1+Math.sin(a+.13)*51],[7+Math.cos(a+.24)*8,-1+Math.sin(a+.24)*14]],'#c9b9aa','#6c6570',1);
  }
  ellipse(7,-1,11,16,'#e3c2a0','#494250',2);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(7+Math.cos(a)*7,-1+Math.sin(a)*11,1.6,2,'#433e50');}
  path('M10 -58 Q42 -40 43 -4',null,'#fff0c8',2);c.restore();

  // Front face: four inset headlamps, black grille, chrome and a split bumper.
  path('M140 497 Q287 506 535 545 L544 628 Q338 622 156 585 L136 551Z','#90374b',ink,5);
  path('M148 506 L527 552 527 592 Q337 582 150 549Z','#292b3f',ink,3);
  // Grille uses individually rendered horizontal bars and dark mullions.
  poly([[268,525],[408,543],[410,579],[271,561]],'#171f31','#ce9a8d',2);
  for(let i=0;i<5;i++) line(276,532+i*6,402,548+i*6,'#93808a',1.6);
  for(let i=0;i<11;i++) line(280+i*12,529+i*1.55,282+i*12,561+i*1.55,'#333346',2);
  function lamp(x,y,rx,ry) {
    ellipse(x,y,rx+5,ry+4,'#a99694','#171f31',3);
    ellipse(x,y,rx,ry,'#ffe4ad','#ead0a8',2);
    ellipse(x-3,y-3,rx*.65,ry*.7,'#fff1ca');
    for(let i=-2;i<3;i++) line(x+i*4,y-ry+3,x+i*4+2,y+ry-3,'#dbb78e',1);
    line(x-rx+3,y+4,x+rx-3,y+4,'#f8cb94',1);
  }
  lamp(181,531,20,17);lamp(230,537,20,18);lamp(445,563,22,20);lamp(497,570,21,20);
  path('M154 560 Q344 597 535 603 L539 622 Q321 612 153 581Z','#d7b3a0',ink,3);
  path('M157 563 Q346 601 530 607',null,'#fff0bf',3);
  path('M174 584 L527 623 526 638 Q321 630 183 602Z','#4b2d44',ink,2);
  poly([[285,592],[370,603],[368,627],[284,616]],'#e8ccaa',ink,2);
  c.save();c.translate(326,610);c.transform(1,.13,0,1,0,0);c.font='bold 11px monospace';c.textAlign='center';c.fillStyle='#5b4659';c.fillText('SUN • 78',0,3);c.restore();
  poly([[160,553],[192,558],[191,565],[160,560]],'#ffb763','#582f46',1);
  poly([[482,597],[515,602],[515,608],[482,603]],'#f3b063','#582f46',1);
  // A small original badge and bright metal glints.
  poly([[337,518],[347,522],[337,528],[327,522]],'#ffe1a4',ink,1.5);
  line(337,520,337,525,'#ad5d5a',1);
  path('M511 532 L522 529 M516 523 L518 538',null,'#ffe7b2',2);
  path('M161 476 L165 464 M156 470 L172 470',null,'#fff0bf',2);
  path('M766 449 L776 444 M770 439 L772 454',null,'#ffe6b0',1.5);
  // Restrained comic hatching anchors edges without dirtying the silhouette.
  for(let i=0;i<9;i++) line(174+i*10,591+i*1.65,181+i*10,600+i*1.65,'#672f47',1.4);
  for(let i=0;i<8;i++) line(561+i*5,577-i*2,566+i*5,585-i*2,'#94364c',1.3);

  // Foreground vegetation and an editorial vignette frame the large subject.
  path('M0 760 L0 658 19 701 15 635 36 711 48 673 55 729 86 705 77 746 120 727 104 760Z','#28283f',null);
  path('M1000 760 L1000 658 978 708 978 674 960 726 939 697 944 743 909 731 922 760Z','#28283f',null);
  const vignette=c.createRadialGradient(506,393,230,506,393,690);
  vignette.addColorStop(0,'rgba(40,24,53,0)');vignette.addColorStop(.7,'rgba(40,24,53,0)');vignette.addColorStop(1,'rgba(28,22,46,.3)');
  c.fillStyle=vignette;c.fillRect(0,0,1000,760);
  return canvas;
}
