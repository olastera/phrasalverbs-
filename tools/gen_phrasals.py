"""Genera contingut/phrasals.json i comprova que cada exemple conté la partícula una sola vegada."""
import json, re, sys

# (phrasal, verb, particula, sinonim, significat, exemple, traduccio, tema, nivell)
D = [
("give up","give","up","quit","rendir-se, deixar de fer alguna cosa","Don't give up now: you're almost there!","No et rendeixis ara: gairebé hi ets!","sentiments",1),
("give in","give","in","surrender","cedir","After hours of arguing, my parents finally gave in and let me go to the concert.","Després d'hores de discutir, els meus pares finalment van cedir i em van deixar anar al concert.","relacions",2),
("give back","give","back","return","tornar una cosa a qui te l'havia deixat","Can you give back the charger I lent you?","Em pots tornar el carregador que et vaig deixar?","quotidia",1),
("give away","give","away","donate","regalar; també revelar un secret","She gave away all her old clothes to charity.","Va regalar tota la roba vella a una entitat benèfica.","diners",2),
("give out","give","out","distribute","repartir","The teacher gave out the exam papers at nine o'clock.","El professor va repartir els exàmens a les nou.","estudis",2),
("get up","get","up","rise","llevar-se","I get up at seven every morning during the exam period.","Em llevo a les set cada matí durant l'època d'exàmens.","quotidia",1),
("get on with","get","on with","have a good relationship with","portar-se bé amb algú","I get on with my sister much better now that we're older.","Ara que som més grans em porto molt millor amb la meva germana.","relacions",1),
("get over","get","over","recover from","superar, refer-se d'alguna cosa","It took him months to get over the break-up.","Li va costar mesos superar la ruptura.","sentiments",1),
("get along","get","along","be friendly","entendre's, portar-se bé","Do you get along with your new classmates?","T'entens bé amb els nous companys de classe?","relacions",1),
("get by","get","by","manage","espavilar-se, anar fent amb poc","I don't speak much German, but I can get by.","No parlo gaire alemany, però m'hi puc espavilar.","quotidia",2),
("get away with","get","away with","escape punishment","sortir-se'n sense càstig","He cheated in the exam and got away with it.","Va copiar a l'examen i se'n va sortir.","problemes",2),
("get back","get","back","return","tornar (a un lloc)","What time did you get back from the party?","A quina hora vas tornar de la festa?","moviment",1),
("get through","get","through","survive","superar, passar (un moment difícil)","We'll get through this exam season together.","Superarem junts aquesta temporada d'exàmens.","sentiments",2),
("get rid of","get","rid of","eliminate","desfer-se de","I need to get rid of all these old notes.","M'he de desfer de tots aquests apunts vells.","quotidia",2),
("get across","get","across","communicate","fer entendre (una idea)","It's hard to get your message across in only 150 words.","És difícil fer entendre el teu missatge en només 150 paraules.","comunicacio",3),
("get down to","get","down to","start seriously","posar-se seriosament a fer alguna cosa","Stop checking your phone and get down to work!","Deixa de mirar el mòbil i posa't a treballar de debò!","estudis",3),
("get together","get","together","meet","reunir-se, quedar","Let's get together on Saturday to study.","Quedem dissabte per estudiar.","relacions",1),
("take off","take","off","depart","enlairar-se (un avió); també treure's roba","The plane took off two hours late.","L'avió es va enlairar amb dues hores de retard.","moviment",1),
("take up","take","up","start (a hobby)","començar una afició o activitat","My brother has taken up the guitar.","El meu germà ha començat a tocar la guitarra.","quotidia",2),
("take after","take","after","resemble","assemblar-se a un familiar","Laura takes after her mother: they're both very creative.","La Laura s'assembla a la seva mare: totes dues són molt creatives.","relacions",2),
("take over","take","over","take control of","prendre el control, fer-se càrrec","A big company took over the small family business.","Una gran empresa va prendre el control del petit negoci familiar.","feina",2),
("take on","take","on","hire","contractar; també assumir una responsabilitat","The shop is taking on extra staff for Christmas.","La botiga contracta personal extra per Nadal.","feina",3),
("take back","take","back","retract","retirar el que has dit; també tornar una cosa a la botiga","I take back what I said; I was wrong.","Retiro el que he dit; m'equivocava.","comunicacio",2),
("take in","take","in","deceive","enganyar algú","Don't be taken in by fake news on social media.","No et deixis enganyar per les notícies falses a les xarxes.","comunicacio",3),
("take care of","take","care of","look after","tenir cura de","Who will take care of your dog while you're away?","Qui tindrà cura del teu gos mentre siguis fora?","relacions",1),
("take out","take","out","remove","treure (d'algun lloc)","Take out a pen and a piece of paper.","Traieu un bolígraf i un full de paper.","estudis",1),
("put off","put","off","postpone","ajornar, deixar per a més tard","Stop putting off your homework!","Deixa d'ajornar els deures!","estudis",1),
("put up with","put","up with","tolerate","suportar, aguantar","I can't put up with this noise any longer.","No puc suportar més aquest soroll.","problemes",2),
("put on","put","on","dress in","posar-se (roba)","Put on your coat; it's freezing outside.","Posa't l'abric; fa un fred que pela.","quotidia",1),
("put out","put","out","extinguish","apagar (un foc)","The firefighters put out the fire in less than an hour.","Els bombers van apagar el foc en menys d'una hora.","problemes",2),
("put away","put","away","store","desar, guardar al seu lloc","Put away your phones, please. The exam is starting.","Deseu els mòbils, si us plau. Comença l'examen.","quotidia",1),
("put forward","put","forward","propose","proposar (una idea)","She put forward a very interesting idea at the meeting.","Va proposar una idea molt interessant a la reunió.","comunicacio",3),
("put up","put","up","accommodate","allotjar algú","My aunt put us up for a week in London.","La meva tieta ens va allotjar una setmana a Londres.","relacions",3),
("put down","put","down","criticise","menysprear, humiliar","He's always putting people down to feel better.","Sempre està menyspreant la gent per sentir-se millor.","relacions",3),
("look after","look","after","take care of","cuidar","I look after my little brother on Fridays.","Els divendres cuido el meu germà petit.","relacions",1),
("look for","look","for","search for","buscar","I'm looking for my keys. Have you seen them?","Busco les claus. Les has vist?","quotidia",1),
("look forward to","look","forward to","anticipate","tenir moltes ganes de","I'm really looking forward to the summer holidays.","Tinc moltíssimes ganes que arribin les vacances d'estiu.","sentiments",1),
("look up","look","up","consult","buscar (en un diccionari, a internet)","If you don't know a word, look it up in the dictionary.","Si no saps una paraula, busca-la al diccionari.","estudis",1),
("look up to","look","up to","admire","admirar algú","Many teenagers look up to famous athletes.","Molts adolescents admiren els esportistes famosos.","relacions",2),
("look down on","look","down on","despise","menysprear algú","You shouldn't look down on people who earn less than you.","No hauries de menysprear la gent que guanya menys que tu.","relacions",3),
("look into","look","into","investigate","investigar","The police are looking into the robbery.","La policia investiga el robatori.","problemes",2),
("look out","look","out","be careful","anar amb compte","Look out! There's a car coming!","Compte! Ve un cotxe!","quotidia",1),
("look over","look","over","examine","revisar, donar un cop d'ull","Could you look over my essay before I hand it in?","Em podries revisar la redacció abans de lliurar-la?","estudis",2),
("look back on","look","back on","remember","recordar (el passat)","I'll always look back on these years with a smile.","Sempre recordaré aquests anys amb un somriure.","sentiments",3),
("turn down","turn","down","reject","rebutjar; també abaixar el volum","She turned down the job offer because the salary was too low.","Va rebutjar l'oferta de feina perquè el sou era massa baix.","feina",2),
("turn up","turn","up","arrive","presentar-se, aparèixer; també apujar el volum","He turned up half an hour late, as usual.","Es va presentar mitja hora tard, com sempre.","quotidia",2),
("turn on","turn","on","switch on","encendre","Can you turn on the light, please?","Pots encendre el llum, si us plau?","tecnologia",1),
("turn off","turn","off","switch off","apagar","Turn off your phone during the exam.","Apaga el mòbil durant l'examen.","tecnologia",1),
("turn into","turn","into","become","convertir-se en","The small café turned into a famous restaurant.","La petita cafeteria es va convertir en un restaurant famós.","quotidia",2),
("turn out","turn","out","prove to be","resultar","The exam turned out to be easier than we expected.","L'examen va resultar més fàcil del que esperàvem.","estudis",2),
("turn to","turn","to","ask for help","recórrer a algú","When I have a problem, I always turn to my best friend.","Quan tinc un problema, sempre recorro al meu millor amic.","relacions",2),
("come across","come","across","find by chance","trobar per casualitat","I came across some old photos while I was tidying my room.","Mentre endreçava l'habitació vaig trobar unes fotos antigues.","quotidia",2),
("come up with","come","up with","think of","idear, tenir (una idea)","We need to come up with a solution to this problem.","Hem de trobar una solució a aquest problema.","comunicacio",2),
("come back","come","back","return","tornar (a un lloc)","When are you coming back from Paris?","Quan tornes de París?","moviment",1),
("come over","come","over","visit","venir a casa, passar a veure","Why don't you come over tonight and we'll watch a film?","Per què no véns a casa aquesta nit i mirem una peli?","relacions",1),
("come up","come","up","arise","sorgir (un problema, un tema)","Something has come up, so I can't meet you today.","Ha sorgit una cosa, així que avui no puc quedar.","problemes",2),
("come down with","come","down with","catch (an illness)","agafar una malaltia","I think I'm coming down with the flu.","Crec que estic agafant la grip.","salut",3),
("come out","come","out","be released","sortir a la venda, publicar-se","Their new album comes out next Friday.","El seu nou disc surt divendres que ve.","quotidia",2),
("come along","come","along","progress","avançar, progressar; també acompanyar","How is your project coming along?","Com va el projecte?","estudis",3),
("break down","break","down","stop working","espatllar-se (una màquina); també ensorrar-se","Our car broke down on the motorway.","El nostre cotxe es va espatllar a l'autopista.","problemes",1),
("break up","break","up","separate","trencar una relació, separar-se","Mark and Julia broke up last month.","El Mark i la Julia van trencar el mes passat.","relacions",1),
("break into","break","into","enter illegally","entrar a robar","Someone broke into our flat while we were on holiday.","Algú va entrar a robar al pis mentre érem de vacances.","problemes",2),
("break out","break","out","start suddenly","esclatar (una guerra, un incendi)","The Second World War broke out in 1939.","La Segona Guerra Mundial va esclatar el 1939.","problemes",2),
("bring up","bring","up","raise","criar; també treure un tema","She was brought up by her grandparents.","La van criar els seus avis.","relacions",2),
("bring about","bring","about","cause","provocar, causar","Social media has brought about huge changes in how we communicate.","Les xarxes socials han provocat grans canvis en com ens comuniquem.","tecnologia",3),
("bring back","bring","back","evoke","fer recordar; també tornar una cosa","This song brings back memories of my childhood.","Aquesta cançó em fa recordar la infantesa.","sentiments",2),
("bring in","bring","in","introduce","introduir (una llei, una norma)","The government brought in a new law against plastic bags.","El govern va introduir una nova llei contra les bosses de plàstic.","feina",3),
("bring down","bring","down","reduce","reduir; també fer caure (un govern)","The government wants to bring down unemployment.","El govern vol reduir l'atur.","feina",3),
("carry on","carry","on","continue","continuar","Carry on reading until the end of the chapter.","Continueu llegint fins al final del capítol.","estudis",1),
("carry out","carry","out","perform","dur a terme","Scientists carried out an experiment with 500 volunteers.","Els científics van dur a terme un experiment amb 500 voluntaris.","feina",2),
("call off","call","off","cancel","cancel·lar","The match was called off because of the rain.","El partit es va cancel·lar a causa de la pluja.","quotidia",2),
("call back","call","back","return a call","tornar la trucada","I'm busy right now. Can I call you back later?","Ara estic ocupat. Et puc tornar la trucada més tard?","comunicacio",1),
("call for","call","for","require","requerir, exigir","This situation calls for immediate action.","Aquesta situació requereix una acció immediata.","comunicacio",3),
("check in","check","in","register","registrar-se (a l'hotel); facturar (a l'aeroport)","We have to check in two hours before the flight.","Hem de facturar dues hores abans del vol.","moviment",2),
("check out","check","out","leave (a hotel)","deixar l'hotel; també donar un cop d'ull","We checked out of the hotel at eleven.","Vam deixar l'hotel a les onze.","moviment",2),
("cut down on","cut","down on","reduce","reduir el consum de","I'm trying to cut down on sugar.","Intento reduir el sucre.","salut",2),
("cut off","cut","off","disconnect","tallar (un subministrament); també aïllar","The electricity was cut off during the storm.","Durant la tempesta van tallar l'electricitat.","problemes",3),
("cut out","cut","out","stop (eating or doing)","deixar de prendre o de fer alguna cosa","The doctor told me to cut out fried food.","El metge em va dir que deixés el menjar fregit.","salut",3),
("do without","do","without","manage without","passar sense","I can't do without my coffee in the morning.","No puc passar sense el cafè al matí.","quotidia",2),
("do up","do","up","fasten","cordar; també reformar (una casa)","Do up your seatbelt, please.","Corda't el cinturó, si us plau.","quotidia",2),
("drop out","drop","out","quit (school)","abandonar els estudis","He dropped out of university after the first year.","Va deixar la universitat després del primer any.","estudis",2),
("drop by","drop","by","visit briefly","passar a veure algú una estona","Drop by whenever you want; I'm at home all afternoon.","Passa quan vulguis; sóc a casa tota la tarda.","relacions",2),
("drop off","drop","off","leave (someone somewhere)","deixar algú en un lloc (amb el cotxe)","My dad drops me off at school every morning.","El meu pare em deixa a l'escola cada matí.","moviment",2),
("fall out","fall","out","argue","barallar-se (i deixar de parlar-se)","I fell out with my best friend over something stupid.","Em vaig barallar amb el meu millor amic per una ximpleria.","relacions",2),
("fall behind","fall","behind","lag","endarrerir-se, quedar-se enrere","If you miss classes, you'll fall behind.","Si et saltes classes, et quedaràs enrere.","estudis",2),
("fall apart","fall","apart","disintegrate","desfer-se, caure a trossos","My old trainers are falling apart.","Les meves bambes velles estan caient a trossos.","quotidia",2),
("fall through","fall","through","fail","fracassar, anar-se'n en orris (un pla)","Our plans for the trip fell through at the last minute.","Els plans per al viatge se'n van anar en orris a l'últim moment.","problemes",3),
("figure out","figure","out","understand","entendre, resoldre","I can't figure out how to solve this equation.","No aconsegueixo entendre com resoldre aquesta equació.","estudis",2),
("fill in","fill","in","complete","omplir (un formulari)","Please fill in the form with your personal details.","Si us plau, ompliu el formulari amb les vostres dades personals.","quotidia",1),
("find out","find","out","discover","descobrir, assabentar-se","I found out the truth by reading her messages.","Vaig descobrir la veritat llegint els seus missatges.","comunicacio",1),
("fit in","fit","in","belong","encaixar, integrar-se","It was hard for her to fit in at her new school.","Li va costar integrar-se a la nova escola.","relacions",2),
("go on","go","on","happen","passar, succeir; també continuar","What's going on here?","Què passa aquí?","quotidia",1),
("go out","go","out","socialise","sortir (de festa, amb algú)","Are you going out tonight?","Surts aquesta nit?","relacions",1),
("go off","go","off","ring","sonar (una alarma); també fer-se malbé (el menjar)","My alarm didn't go off this morning, so I was late.","Aquest matí no m'ha sonat l'alarma i he fet tard.","quotidia",2),
("go over","go","over","review","repassar","Let's go over the main points before the exam.","Repassem els punts principals abans de l'examen.","estudis",1),
("go through","go","through","experience","passar per una situació difícil","She went through a hard time after her grandmother died.","Va passar una mala època després que morís la seva àvia.","sentiments",2),
("go up","go","up","increase","pujar (preus, temperatura)","Prices have gone up a lot this year.","Els preus han pujat molt aquest any.","diners",1),
("go down","go","down","decrease","baixar, disminuir","The number of smokers has gone down.","El nombre de fumadors ha baixat.","salut",1),
("go ahead","go","ahead","proceed","endavant, tirar endavant","Can I ask a question? Sure, go ahead.","Puc fer una pregunta? És clar, endavant.","comunicacio",1),
("hang out","hang","out","spend time","passar l'estona (amb amics)","We usually hang out at the park after school.","Normalment passem l'estona al parc després de classe.","relacions",1),
("hang up","hang","up","end a call","penjar (el telèfon)","She was so angry that she hung up on me.","Estava tan enfadada que em va penjar.","comunicacio",1),
("hold on","hold","on","wait","esperar un moment","Hold on a second; I'll be right back.","Espera un segon; ara torno.","comunicacio",1),
("hold up","hold","up","delay","endarrerir; també atracar","Sorry I'm late; I was held up in traffic.","Perdona el retard; m'he quedat encallat al trànsit.","problemes",3),
("hold back","hold","back","restrain","contenir (les llàgrimes, els sentiments)","She couldn't hold back her tears.","No va poder contenir les llàgrimes.","sentiments",3),
("keep up with","keep","up with","stay level with","seguir el ritme de","It's hard to keep up with all the new technology.","És difícil seguir el ritme de totes les noves tecnologies.","tecnologia",2),
("keep on","keep","on","continue","continuar, seguir (fent)","If you keep on practising, you'll pass the exam.","Si continues practicant, aprovaràs l'examen.","estudis",1),
("keep away from","keep","away from","avoid","mantenir-se lluny de","Keep away from the edge of the cliff!","Allunya't de la vora del penya-segat!","moviment",2),
("let down","let","down","disappoint","decebre, fallar a algú","I promised to help him, and I won't let him down.","Li vaig prometre que l'ajudaria i no li fallaré.","relacions",2),
("let in","let","in","admit","deixar entrar","They didn't let us in because we were too young.","No ens van deixar entrar perquè érem massa joves.","quotidia",2),
("make up","make","up","invent","inventar-se (una excusa, una història)","He made up an excuse for not doing his homework.","Es va inventar una excusa per no haver fet els deures.","comunicacio",2),
("make up for","make","up for","compensate","compensar","I'll make up for missing your birthday, I promise.","Et compensaré per haver-me perdut el teu aniversari, t'ho prometo.","relacions",3),
("make out","make","out","distinguish","distingir, entendre (amb dificultat)","I couldn't make out what he was saying.","No vaig poder entendre què deia.","comunicacio",3),
("pick up","pick","up","collect","recollir (algú o alguna cosa)","Can you pick me up from the station?","Em pots venir a buscar a l'estació?","moviment",1),
("point out","point","out","indicate","assenyalar, fer notar","The teacher pointed out some mistakes in my essay.","La professora em va fer notar uns quants errors a la redacció.","comunicacio",2),
("run out of","run","out of","exhaust (a supply)","quedar-se sense","We've run out of milk.","Ens hem quedat sense llet.","quotidia",1),
("run into","run","into","meet by chance","trobar-se algú per casualitat","I ran into my old teacher at the supermarket.","Em vaig trobar el meu antic professor al súper.","relacions",2),
("run away","run","away","escape","fugir, escapar-se","The thief ran away when he saw the police.","El lladre va fugir quan va veure la policia.","moviment",1),
("run over","run","over","hit (with a vehicle)","atropellar","Be careful, or you'll get run over!","Vés amb compte o t'atropellaran!","problemes",2),
("set up","set","up","establish","crear, muntar (una empresa)","They set up their own company when they were only twenty.","Van muntar la seva pròpia empresa quan només tenien vint anys.","feina",2),
("set off","set","off","depart","sortir de viatge","We set off early to avoid the traffic.","Vam sortir d'hora per evitar el trànsit.","moviment",2),
("show off","show","off","boast","fatxendejar, fer-se veure","Stop showing off your new phone!","Deixa de fatxendejar amb el teu mòbil nou!","relacions",2),
("show up","show","up","appear","aparèixer, presentar-se","Only five people showed up to the meeting.","Només cinc persones es van presentar a la reunió.","quotidia",2),
("sort out","sort","out","solve","solucionar, arreglar","Don't worry; we'll sort out the problem together.","No pateixis; solucionarem el problema junts.","problemes",2),
("stand out","stand","out","be noticeable","destacar","Her essay stood out because it was so original.","La seva redacció va destacar perquè era molt original.","estudis",2),
("stand for","stand","for","represent","significar (unes sigles)","What does PAU stand for?","Què volen dir les sigles PAU?","comunicacio",2),
("stand up for","stand","up for","defend","defensar (algú o unes idees)","You should always stand up for your friends.","Sempre hauries de defensar els teus amics.","relacions",2),
("throw away","throw","away","discard","llençar (a les escombraries)","Don't throw away plastic bottles; recycle them.","No llencis les ampolles de plàstic; recicla-les.","quotidia",1),
("try on","try","on","test (clothes)","emprovar-se roba","Can I try on these jeans?","Em puc emprovar aquests texans?","diners",1),
("wake up","wake","up","awake","despertar-se","I woke up in the middle of the night.","Em vaig despertar enmig de la nit.","quotidia",1),
("work out","work","out","exercise","fer exercici; també resoldre","I work out at the gym three times a week.","Faig exercici al gimnàs tres cops per setmana.","salut",1),
("wear out","wear","out","exhaust","esgotar algú; també gastar una cosa","Studying all night has worn me out.","Estudiar tota la nit m'ha esgotat.","salut",3),
("count on","count","on","rely on","comptar amb","You can always count on me.","Sempre pots comptar amb mi.","relacions",1),
("deal with","deal","with","handle","tractar, ocupar-se de","How do you deal with stress before exams?","Com gestiones l'estrès abans dels exàmens?","sentiments",2),
("rely on","rely","on","depend on","dependre de, refiar-se de","Too many students rely on their phones to do simple maths.","Massa estudiants depenen del mòbil per fer càlculs senzills.","tecnologia",2),
("settle down","settle","down","become stable","establir-se, assentar el cap","After years of travelling, he settled down in Girona.","Després d'anys viatjant, es va establir a Girona.","quotidia",3),
("slow down","slow","down","decelerate","anar més a poc a poc","Slow down! You're driving too fast.","Afluixa! Condueixes massa ràpid.","moviment",1),
("grow up","grow","up","mature","créixer, fer-se gran","I grew up in a small village near Lleida.","Em vaig criar en un poble petit a prop de Lleida.","relacions",1),
("blow up","blow","up","explode","explotar, fer volar pels aires","The old bridge was blown up in the film.","A la pel·lícula van fer volar pels aires el pont vell.","problemes",2),
("catch up","catch","up","reach","posar-se al dia; també atrapar algú","I missed a week of classes, so I need to catch up.","Em vaig perdre una setmana de classes, així que m'he de posar al dia.","estudis",2),
("cheer up","cheer","up","become happier","animar-se","Cheer up! It's not the end of the world.","Anima't! No és la fi del món.","sentiments",1),
("calm down","calm","down","relax","calmar-se","Calm down and read the question again.","Calma't i torna a llegir la pregunta.","sentiments",1),
("chill out","chill","out","relax","relaxar-se","After the exams, I just want to chill out.","Després dels exàmens, només vull relaxar-me.","sentiments",1),
("end up","end","up","finish (in a situation)","acabar (fent o sent alguna cosa)","We got lost and ended up in a different town.","Ens vam perdre i vam acabar en un altre poble.","quotidia",2),
("back up","back","up","copy (files)","fer una còpia de seguretat; també donar suport","Always back up your files before updating your computer.","Fes sempre una còpia de seguretat dels fitxers abans d'actualitzar l'ordinador.","tecnologia",2),
("log in","log","in","sign in","iniciar sessió","You need a password to log in.","Necessites una contrasenya per iniciar sessió.","tecnologia",1),
("sign up","sign","up","register","inscriure's","I've signed up for an English course this summer.","M'he inscrit a un curs d'anglès aquest estiu.","estudis",1),
("hand in","hand","in","submit","lliurar, entregar (una feina)","You must hand in your project by Friday.","Has de lliurar el projecte abans de divendres.","estudis",1),
("brush up on","brush","up on","refresh","refrescar, repassar (un coneixement)","I need to brush up on my grammar before the PAU.","He de refrescar la gramàtica abans de la PAU.","estudis",3),
("join in","join","in","participate","participar, afegir-se","Everyone joined in the conversation.","Tothom es va afegir a la conversa.","comunicacio",2),
("speak up","speak","up","speak louder","parlar més fort; també dir el que penses","Could you speak up, please? We can't hear you at the back.","Podries parlar més fort, si us plau? Al fons no et sentim.","comunicacio",2),
("pass away","pass","away","die","morir (eufemisme)","His grandfather passed away last year.","El seu avi va morir l'any passat.","salut",2),
("pass out","pass","out","faint","desmaiar-se","It was so hot that a student passed out in the exam room.","Feia tanta calor que un estudiant es va desmaiar a l'aula d'examen.","salut",2),
("split up","split","up","separate","separar-se","My parents split up when I was ten.","Els meus pares es van separar quan jo tenia deu anys.","relacions",2),
("think over","think","over","consider","rumiar, pensar-s'ho bé","I need some time to think it over.","Necessito una mica de temps per pensar-m'ho.","comunicacio",2),
("use up","use","up","consume","gastar del tot","We've used up all the paper in the printer.","Hem gastat tot el paper de la impressora.","quotidia",2),
("lay off","lay","off","dismiss","acomiadar (per falta de feina)","The factory laid off 200 workers.","La fàbrica va acomiadar 200 treballadors.","feina",3),
("eat out","eat","out","dine out","menjar fora","We usually eat out on Sundays.","Normalment mengem fora els diumenges.","quotidia",1),
("save up","save","up","save money","estalviar (per comprar alguna cosa)","I'm saving up for a new laptop.","Estalvio per comprar-me un portàtil nou.","diners",1),
("pay back","pay","back","repay","tornar diners","I'll pay you back tomorrow.","Demà et tornaré els diners.","diners",1),
("shop around","shop","around","compare prices","comparar preus abans de comprar","It's worth shopping around before you buy a new phone.","Val la pena comparar preus abans de comprar un mòbil nou.","diners",3),
("sell out","sell","out","be sold completely","exhaurir-se (entrades, productes)","The concert tickets sold out in ten minutes.","Les entrades del concert es van exhaurir en deu minuts.","diners",2),
]

IRR = {"give":"gave given","get":"got gotten","take":"took taken","come":"came","break":"broke broken",
 "bring":"brought","do":"did done does","fall":"fell fallen","find":"found","go":"went gone goes","hang":"hung",
 "hold":"held","keep":"kept","make":"made","run":"ran","show":"shown","stand":"stood","throw":"threw thrown",
 "wake":"woke woken","wear":"wore worn","grow":"grew grown","blow":"blew blown","catch":"caught catches",
 "sell":"sold","think":"thought","pay":"paid","lay":"laid","speak":"spoke spoken","eat":"ate eaten","rely":"relies relied","carry":"carries carried"}
def formes(v):
    f = {v, v+"s", v+"es", v+"ed", v+"d", v+"ing", v[:-1]+"ing", v+v[-1]+"ing", v+v[-1]+"ed"}
    f |= set(IRR.get(v, "").split())
    return f
# Grups de phrasals amb significat gairebé igual: mai no poden sortir com a distractors entre ells.
GRUPS = [
 ["carry-on","go-on","keep-on"], ["get-on-with","get-along"], ["get-over","get-through","go-through"],
 ["put-out","turn-off"], ["put-down","look-down-on"], ["look-for","look-up"], ["turn-up","show-up"],
 ["come-across","run-into"], ["come-over","drop-by"], ["break-up","split-up"],
 ["figure-out","make-out","work-out"], ["calm-down","chill-out"], ["check-in","sign-up"],
 ["go-over","brush-up-on","look-over"], ["bring-down","cut-down-on"], ["wear-out","use-up"],
 ["give-back","pay-back","take-back"], ["get-back","come-back"], ["take-off","set-off"],
 ["look-after","take-care-of"], ["go-out","hang-out"], ["get-up","wake-up"], ["put-on","try-on"],
 ["grow-up","bring-up"], ["count-on","rely-on"], ["throw-away","get-rid-of"],
]
# Altres phrasals reals (fora de les dades) per verb: al minijoc B no poden sortir com a distractors,
# perquè podrien formar una frase correcta (p. ex. "I get off at seven").
EXTRA = {
 "give":"off over", "get":"in off on out down into away around ahead behind about to at with out of up to over with",
 "take":"away down apart to along in through", "put":"over in back through across together by into aside",
 "look":"around at through ahead back in on down away out for", "turn":"around back over in away against",
 "come":"away in on down through round around from by about off into apart after up against",
 "break":"in off through away apart", "bring":"out on along over round forward together off",
 "carry":"off away over through back along", "call":"in on up out round by", "check":"up on over on off through",
 "cut":"down back in up across through back on", "do":"away with over in out", "drop":"in back behind out of",
 "fall":"down over for off back in into back on behind with", "figure":"on", "fill":"out up in for",
 "fit":"in with into out", "go":"to back away in into by around along for after with without out with back on under about together forward",
 "hang":"on around about back in over out with", "hold":"off out down in onto", "keep":"up out off back down away in out of",
 "let":"off out on up through", "make":"off for over into of out of", "pick":"on out off at", "point":"to at",
 "run":"out off up down after through across around away with by in up against back", "set":"out in back down about aside apart out on",
 "show":"around in out round", "stand":"up by in down back out from", "throw":"out up off in on together",
 "try":"out for", "work":"on up off at through", "wear":"off down on away", "count":"in out up down",
 "deal":"in out", "rely":"upon", "settle":"in on for up", "slow":"up", "grow":"out of into apart on",
 "blow":"out away over off down", "catch":"on out up with", "cheer":"on", "back":"down off out away",
 "log":"out on off into", "sign":"in out on off for up for", "hand":"out over back down round on",
 "brush":"up off aside", "join":"up on", "speak":"out up for for to about",
 "pass":"by on over up down off around through", "think":"about up through back ahead",
 "lay":"out down up on", "eat":"up in away into", "save":"up for", "pay":"off out up for in", "sell":"off up",
}
# les entrades de dues paraules s'han d'escriure juntes; aquí es parteixen amb una llista explícita
DUES = {"out of","up to","over with","out for","up against","back on","behind with","in with","in for","away with",
        "out with","out on","out from","up with","up for","up on"}
def parteix(txt):
    w = txt.split(); res = []; i = 0
    while i < len(w):
        if i + 1 < len(w) and f"{w[i]} {w[i+1]}" in DUES: res.append(f"{w[i]} {w[i+1]}"); i += 2
        else: res.append(w[i]); i += 1
    return res
TEMES = {"quotidia","relacions","estudis","feina","problemes","comunicacio","moviment","diners","salut","sentiments","tecnologia"}
out, errs, ids = [], [], set()
for (ph, verb, part, sin, sig, ex, tr, tema, niv) in D:
    assert ph == f"{verb} {part}", ph
    assert tema in TEMES, (ph, tema)
    pid = ph.replace(" ", "-")
    assert pid not in ids, pid
    ids.add(pid)
    pat = r"\b" + r"\s+".join(map(re.escape, part.split())) + r"\b"
    # la partícula pot anar separada del verb (look it up), però ha d'aparèixer exactament una vegada
    hits = re.findall(pat, ex, flags=re.I)
    if len(hits) != 1:
        errs.append(f"{ph}: '{part}' apareix {len(hits)} cops a «{ex}»")
        continue
    # forma verbal: la primera paraula abans de la partícula que sigui una forma del verb
    m = re.search(pat, ex, flags=re.I)
    forms = formes(verb)
    vf = None
    for w in re.finditer(r"[A-Za-z']+", ex[:m.start()]):
        if w.group().lower() in forms: vf = w
    if not vf:
        errs.append(f"{ph}: no trobo la forma verbal a «{ex}»"); continue
    marcat = ex[:vf.start()] + "**" + vf.group() + "**" + ex[vf.end():m.start()] + "**" + m.group() + "**" + ex[m.end():]
    if vf.end() == m.start() - 1:  # verb i partícula junts: un sol bloc
        marcat = ex[:vf.start()] + "**" + ex[vf.start():m.end()] + "**" + ex[m.end():]
    forat = re.sub(pat, " ".join("___" for _ in part.split()), ex, count=1, flags=re.I)
    out.append({"id": pid, "phrasal": ph, "verb": verb, "particula": part, "sinonim": sin,
                "significat": sig, "exemple": ex, "exempleMarcat": marcat, "forat": forat, "traduccio": tr,
                "tema": tema, "nivell": niv})
sim = {o["id"]: set() for o in out}
for g in GRUPS:
    for i in g:
        if i not in sim: errs.append(f"grup: id desconegut {i}"); continue
        sim[i] |= set(g) - {i}
# el mateix sinònim també vol dir "similar"
for a in out:
    for b in out:
        if a["id"] != b["id"] and a["sinonim"] == b["sinonim"]: sim[a["id"]].add(b["id"])
byid = {o["id"]: o for o in out}
for o in out:
    o["similars"] = sorted(sim[o["id"]])
    proh = {x["particula"] for x in out if x["verb"] == o["verb"]}
    proh |= set(parteix(EXTRA.get(o["verb"], "")))
    proh |= {byid[i]["particula"] for i in o["similars"]}
    proh.discard(o["particula"])
    o["particulesProhibides"] = sorted(proh)
pool = {o["particula"] for o in out}
for o in out:
    n = len(o["particula"].split())
    ok = [p for p in pool if p != o["particula"] and p not in o["particulesProhibides"]]
    if len([p for p in ok if len(p.split()) == n]) < 3:
        print(f"avís {o['id']}: només {len([p for p in ok if len(p.split()) == n])} distractors amb {n} paraules ({len(ok)} en total)")
if errs:
    print("\n".join(errs)); sys.exit(1)
json.dump({"versio": 1, "phrasals": out}, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(out), "phrasals |", dict(Counter(o["nivell"] for o in out)), "|", dict(Counter(o["tema"] for o in out)))
