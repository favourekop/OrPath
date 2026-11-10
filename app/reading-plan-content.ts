export type ReadingDay = {
  title: string;
  reference: string;
  passage: string;
  reflection: string;
  practice: string;
};

export type ReadingPlan = {
  title: string;
  days: ReadingDay[];
};

export const readingPlanContent: ReadingPlan[] = [
  {
    title: "A Quiet Heart",
    days: [
      { title: "Be still", reference: "Psalm 46:10", passage: "Be still, and know that I am God.", reflection: "Stillness is not wasted time. It is space to remember who God is and to let your heart settle in His presence.", practice: "Spend five quiet minutes without your phone. Name one worry you are placing in God's hands." },
      { title: "Come and rest", reference: "Matthew 11:28", passage: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", reflection: "Jesus does not ask you to pretend you are strong. He invites you to bring your tiredness to Him.", practice: "Write down what feels heavy today, then pray honestly about it." },
      { title: "Peace within", reference: "Philippians 4:6–7", passage: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", reflection: "Prayer turns anxious thoughts into conversations with God. Gratitude helps you notice His care even while you wait.", practice: "Turn one anxious thought into a specific prayer and list two things you are thankful for." },
      { title: "A guarded heart", reference: "Proverbs 4:23", passage: "Keep thy heart with all diligence; for out of it are the issues of life.", reflection: "What you repeatedly allow into your heart shapes your choices. Protect your inner life with truth, wisdom, and healthy boundaries.", practice: "Choose one distraction to limit today and replace that time with Scripture." },
      { title: "Renewed strength", reference: "Isaiah 40:31", passage: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.", reflection: "Waiting on God is active trust. You can take the next faithful step without having every answer.", practice: "Identify one next step you can take calmly, then ask God for strength to take it." },
    ],
  },
  {
    title: "Wisdom for Today",
    days: [
      { title: "Ask for wisdom", reference: "James 1:5", passage: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally.", reflection: "You do not have to make every decision from your own understanding. God welcomes your request for wisdom.", practice: "Bring one decision before God. Write down what a wise and loving next step might look like." },
      { title: "Trust the path", reference: "Proverbs 3:5–6", passage: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", reflection: "Trust means inviting God into the whole direction of your life, not only the parts you can explain.", practice: "Pray over your plans for today and stay open to a wiser direction." },
      { title: "Listen first", reference: "James 1:19", passage: "Let every man be swift to hear, slow to speak, slow to wrath.", reflection: "Wisdom often begins with listening. A patient response can protect a relationship and reveal what matters.", practice: "In one conversation today, listen fully before preparing your reply." },
      { title: "Choose good counsel", reference: "Proverbs 15:22", passage: "Without counsel purposes are disappointed: but in the multitude of counsellors they are established.", reflection: "Wise people invite trustworthy counsel. Humility helps us see what we might miss alone.", practice: "Ask a trusted, wise person for perspective on something you are working through." },
      { title: "Walk with integrity", reference: "Proverbs 10:9", passage: "He that walketh uprightly walketh surely: but he that perverteth his ways shall be known.", reflection: "Integrity is choosing what is right when nobody is watching. It gives your decisions a steady foundation.", practice: "Make one honest choice today, even if it is less convenient." },
      { title: "Words that build", reference: "Ephesians 4:29", passage: "Let no corrupt communication proceed out of your mouth, but that which is good to the use of edifying.", reflection: "Your words can become shelter and encouragement. Wisdom considers not only whether words are true, but whether they help.", practice: "Encourage one person with a specific, sincere message." },
      { title: "Put wisdom to work", reference: "Matthew 7:24", passage: "Whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man.", reflection: "Biblical wisdom is lived, not merely collected. A small obedient action can turn today's reading into a stronger foundation.", practice: "Choose one lesson from this plan and put it into practice before the day ends." },
    ],
  },
  {
    title: "The Life of Jesus",
    days: [
      { title: "The Word became flesh", reference: "John 1:14", passage: "And the Word was made flesh, and dwelt among us, (and we beheld his glory).", reflection: "Jesus came near. God’s love is not distant or abstract; in Christ, He entered human life and lived among us.", practice: "Reflect on one way Jesus meets people with compassion. Look for an opportunity to do the same." },
      { title: "A humble beginning", reference: "Luke 2:11", passage: "For unto you is born this day in the city of David a Saviour, which is Christ the Lord.", reflection: "The birth of Jesus announces hope for ordinary people. God's greatest gift arrived with humility.", practice: "Thank God for the gift of Jesus. Share a word of hope with someone." },
      { title: "Baptised and beloved", reference: "Matthew 3:17", passage: "This is my beloved Son, in whom I am well pleased.", reflection: "Before His public ministry, Jesus is affirmed as the beloved Son. Your worth is not something you earn by performance.", practice: "Take a moment to rest in God's love rather than measuring yourself by achievement." },
      { title: "Led by the Spirit", reference: "Luke 4:1", passage: "And Jesus being full of the Holy Ghost returned from Jordan, and was led by the Spirit into the wilderness.", reflection: "Jesus faced testing with spiritual focus. Temptation does not have to decide your direction.", practice: "Name one pressure you face and choose a Scripture truth to answer it." },
      { title: "Good news for all", reference: "Luke 4:18", passage: "The Spirit of the Lord is upon me, because he hath anointed me to preach the gospel to the poor.", reflection: "Jesus' mission brings hope, freedom, healing, and good news. His compassion reaches people who are often overlooked.", practice: "Notice someone who may feel unseen and offer practical kindness." },
      { title: "Come and follow", reference: "Matthew 4:19", passage: "Follow me, and I will make you fishers of men.", reflection: "Following Jesus is a daily response. He invites people as they are and leads them into a changed life.", practice: "Ask what one habit or attitude Jesus is inviting you to change." },
      { title: "A new way to live", reference: "Matthew 5:16", passage: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.", reflection: "Jesus calls His followers to make God's goodness visible through everyday choices.", practice: "Do one quiet act of service without seeking recognition." },
      { title: "Compassion in action", reference: "Mark 1:41", passage: "And Jesus, moved with compassion, put forth his hand, and touched him.", reflection: "Jesus does not turn away from suffering. His compassion moves toward people with dignity and care.", practice: "Respond to someone's need with empathy instead of assumptions." },
      { title: "Make room for prayer", reference: "Mark 1:35", passage: "And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed.", reflection: "Jesus made space for communion with the Father. Prayer was central, not an afterthought.", practice: "Set aside a specific quiet time to pray today, even if it is brief." },
      { title: "Faith over fear", reference: "Mark 4:39", passage: "And he arose, and rebuked the wind, and said unto the sea, Peace, be still.", reflection: "The storm was real, but it was not greater than Jesus. Faith brings fear honestly into His presence.", practice: "Name a storm in your life and pray for courage to trust Jesus through it." },
      { title: "The good shepherd", reference: "John 10:11", passage: "I am the good shepherd: the good shepherd giveth his life for the sheep.", reflection: "Jesus knows and cares for His people. His leadership is marked by sacrifice and love.", practice: "Read Psalm 23 slowly and note one phrase that brings you comfort." },
      { title: "Love one another", reference: "John 13:34", passage: "A new commandment I give unto you, That ye love one another; as I have loved you.", reflection: "Jesus makes love the visible mark of His disciples. This love is patient, practical, and willing to serve.", practice: "Choose one person to serve or forgive in a concrete way." },
      { title: "The way, the truth, and the life", reference: "John 14:6", passage: "Jesus saith unto him, I am the way, the truth, and the life.", reflection: "Jesus is not simply offering directions; He is the way to the Father. We can bring our questions to Him.", practice: "Bring one unanswered question to God and take time to read John 14." },
      { title: "It is finished", reference: "John 19:30", passage: "When Jesus therefore had received the vinegar, he said, It is finished: and he bowed his head, and gave up the ghost.", reflection: "At the cross, Jesus completed the work of redemption. Grace is a gift to receive, not a prize to earn.", practice: "Thank Jesus for His sacrifice. Consider how receiving grace changes the way you treat others." },
    ],
  },
];
