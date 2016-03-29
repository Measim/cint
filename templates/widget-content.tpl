<tpl id="step0">
    <div class="wrapper intro">
        <div class="header">
            <div class="logo" style="background-image:url(../../CINT/build/img/logo-wr.png);"></div>
        </div>
        <div class="formbox">
            <h1 class="js-custom-color-text">{{"widget.intro.we_need_your_opinion"}}</h1>
            <p> {{"widget.intro.description_world_research_provides"}}</p>
            <p>{{"widget.intro.description_opinion_will_help"}}</p>
            <p>{{"widget.intro.description_registration_is_free"}}</p>
        </div>
        <footer>
            <div class="join-btn js-next-step js-custom-background">{{"widget.intro.next_btn"}}</div>
        </footer>
    </div>
</tpl>

<tpl id="step1">
    <div class="wrapper step-one" data-owo-oauth="true">
        <div class="header">
            <div class="steps">{{"widget.step_n_"}} 1 {{"widget.step_n_of"}} 3
            <div class="progress-bar"><span class="js-custom-background" style="width:33%"></span></div>
            </div>
        </div>
        <div class="formbox">
            <div class="">{{"widget.step_one_description_please_connect_a_social_media"}} {{"widget.step_one_description_no_social_registration"}} </div>
            <div class="social-wrapper">
                <div class="js-fb-login fb-share-btn"></div>
                <div class="js-twitter-login twitter-share-btn"></div>
                <div class="js-google-login g-plusone-share-btn"></div>
            </div>
        </div>
        <footer>
            <div class="nav-btn-wrapper">
                <div class="btn-next-step js-custom-background js-next-step">{{"widget.default_btn_next_step"}}</div>
                <div class="btn-prev-step js-prev-step">{{"widget.default_btn_back"}}</div>
            </div>
        </footer>
    </div>
</tpl>

<tpl id="step2">
    <div class="wrapper step-two">
        <div class="header">
            <div class="steps">{{"widget.step_n_"}} 2 {{"widget.step_n_of"}} 3
                <div class="progress-bar"><span class="js-custom-background" style="width:66%"></span></div>
            </div>
        </div>
        <form id="user-info">
            <div class="formbox">
                <p>{{"widget.step_two_description"}}</p>
                <select class="textfield js-form-input" name="gender" required>
                    <option value="" disabled selected>{{"widget.default_placeholder_gender"}}</option>
                    <option value="male">{{"widget.selected_gender_male"}}</option>
                    <option value="female">{{"widget.selected_gender_female"}}</option>
                </select>
                <select class="textfield js-form-input js-age-select" name="dateOfBirth" required>
                    <option value="" disabled selected>{{"widget.default_placeholder_birth_year"}}</option>
                </select>
                <input class="textfield js-form-input" type="text" name="zipcode" maxlength="10" placeholder="{{"widget.default_placeholder_postal_code"}}" required/>
                <input class="textfield js-form-input" type="email" name="email" placeholder="{{"widget.default_placeholder_email"}}" required/>
                <div class="js-form-error js-email-error email-error hide"></div>
                <div class="string">
                    <input class="checkbox js-form-checkbox" type="checkbox" name="terms" id="terms" required>
                    <label for="terms">{{"widget.default_label_accept_the"}} <a href="https://1worldonline.com/terms/terms.html" target="_blank">{{"widget.default_label_terms_and_conditions"}}</a></label>
                </div>
                <div class="js-re-captcha"></div>
            </div>
            <footer>
                <div class="nav-btn-wrapper">
                    <div class="btn-next-step js-custom-background js-next-step js-submit">{{"widget.default_btn_next_step"}}</div>
                    <div class="btn-prev-step js-prev-step">{{"widget.default_btn_back"}}</div>
                </div>
            </footer>
        </form>
    </div>
</tpl>

<tpl id="step3">
    <div class="wrapper step-three">
        <div class="header">
            <div class="steps">{{"widget.step_n_"}} 3 {{"widget.step_n_of"}} 3
                <div class="progress-bar"><span class="js-custom-background" style="width:90%"></span></div>
            </div>
        </div>
        <div class="formbox">
            <h1>{{"widget.final_step_description_thank_you"}}</h1>
            <p>{{"widget.final_step_description_successfull_registration"}}</p>
            <p>{{"widget.final_step_your_registration_email"}}
                <span class="orange-link js-custom-color-text js-last-step-usr-email">email Error</span>
            </p>

            <p>{{"widget.final_step_description_you_will_receive_details"}}</p>

            <p>{{"widget.final_step_redirect_offer"}}</p>
        </div>
        <footer class="hide">
            <div id="" class="join-btn js-custom-background">Close</div>
        </footer>
    </div>
</tpl>