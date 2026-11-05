---
title: 'Understanding Vexl: Security, Privacy, and Building a Web of Trust'
date: 2026-05-21
author: 'Vexl Team'
summary: 'In the wake of never ending discussion, I thought it was high time we talked about why Vexl prefers phone numbers to usernames (or any other…'
image: '/blog/understanding-vexl-security-privacy-and-building-a-web-of-trust/1-silj3diugjbqffkicvw3oa.webp'
featured: true
---

In the wake of never ending discussion, I thought it was high time we talked about why Vexl prefers phone numbers to usernames (or any other revolutionary ID out there). If you’ve ever thought yourself, “Sharing phone numbers with Vexl is stupid!” this one’s for you.

#### What else is out there and why it’s not a good idea

Even though there are certain ways how to buy or sell bitcoin without KYC, they all come with a specific set of drawbacks, among which those related to privacy and security are the most outstanding. Getting a transfer of money of an uncertain origin via SEPA or meeting someone you’ve never met before and cannot validate their identity and credibility brings unnecessary risks to your trades.

At Vexl we’ve spent a lot of time thinking of how to mitigate them while still preserving users’ privacy and keeping it secure. What were we trying to achieve?

#### What do we solve and how

We (correctly) assumed that most people have someone in their social circle who wants to either buy or sell bitcoin. **The problem is just that they have never met and don’t know about each other.**

Vexl solves this problem by providing a platform where these parties could _discover each other._ Just like Uber, Tinder or Airbnb. **Only better — in a privacy preserving way.**

Once you join Vexl, you almost immediately gain an access to a marketplace full of offers. So far nothing special: there is a ton of marketplaces out there. What is different?

In our marketplace you can access only offers from your contacts and contacts of their contacts. All of them are anonymized — you don’t know who is the author of the offer, but you see how many contacts you have in common **and who these people are. You might not know directly who you are dealing with, but you see the social circle you are moving within.** If you think about it for a moment, it is ingenious — we managed to bring real-world reputation to an app.

#####

#### Discreet Social Network

If you zoom out, Vexl is nothing but a social network. And everyone knows that creating and scaling a brand new one from scratch is a real pain in the ass (if you don’t know try for yourself :)). That’s the reason why we decided to build Vexl on the top of an already existing one. But which one to choose?

1.  It must be an old one that is unshakably widespread, because you want to allow **_everyone_** to join.
2.  You want a credible one — where people more or less know each other at least semi-personally. Because real-world reputation, remember?
3.  You want one that is not just fashionable and isn’t going anywhere any time soon. Something that is common in the East, in the West, in the South, and everywhere in between.

Can you think of anything better than phone numbers which every one of us uses and commonly shares with your friends?

On Vexl, your phone number isn’t just another detail; it’s a part of your identity.

#### Privacy on Vexl

Vexl is built with privacy at its core, and this is achieved through a method known as ‘data separation’.

Here’s how it works:

1.  In the backend of the app — the part hidden behind the user interface — user data is divided into four distinct components: user profile, contact list, offers, and chat interactions.
2.  Each component is allocated to a separate microservice. These microservices are independent and do not interact with each other. They each perform specific functions and have their own databases.
3.  All of these components only come together on the client side: your mobile phone.

The server always remains unaware of the associations between numbers and their actions on the platform. We can never say if you used Vexl, if you connected with someone, if you posted an offer, reacted to one or had a chat.

If someone were to successfully decode the hashed numbers, they would only obtain a list of numbers without any context or associated information. Neither of the phone numbers are connected to any chats, or any marketplace offers.

Even if the person went through the analysis of the social graph they would not obtain any valuable information — having someone in the contact list does not really mean much. Certainly not that you were trading or chatting with them on Vexl.

#### Building a Web of Trust

What really sets Vexl apart is the Web of Trust. On Vexl, you’re never trading with strangers; you’re trading within a community of friends, and friends of friends, people who share the same interests as you do.

**And here’s where the magic happens: to be connected with someone and see their offers via a common contact, the middle user does not have to be on Vexl.**

You might not know who the counterparty you connected with is, but you can see what common grounds you share within the realm of the real world. And if you’re still uncertain, you can always ask them to reveal their identity in an end-to-end encrypted chat.

![](/blog/understanding-vexl-security-privacy-and-building-a-web-of-trust/1-48htuui8vdutsmbh2c188a.webp)

Are you still unsure about the counterparty even though you revealed identities? Now you can pick up the phone and do the same as you would do if you were going to a blind date with someone you share a Facebook contact with: ask the common contact for their validation.

#### Future Vision

Once Vexl becomes wide-spread and scales on its own we will be more than keen to introduce an identifier that is completely independent from your real-world identity. But for now I am confident we went with a design that will satisfy majority of (potential) users without putting them in risk or compromising their privacy. And most importantly, allows us to bootstrap Vexl in the most rapid way.

Is the current solution ideal? Probably not, mostly because there is no such thing.

But it is the best solution that serves the goal of Vexl — making privacy-aware peer-to-peer trading of bitcoin without KYC accessible to everyone out there.

Wanna know more? Check out [our GitHub](https://github.com/vexl-it/)!
